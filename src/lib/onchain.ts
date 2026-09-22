import {
  JsonRpcProvider,
  FetchRequest,
  Contract,
  isAddress,
  getAddress,
  formatUnits,
  formatEther,
} from "ethers";
import { ChainConfig, RELAYER_ADDRESS } from "./chains";

const WALLET_VERIFICATION_ABI = [
  "function isAuthorized(address user, address relayer) view returns (bool)",
];

const ERC20_ABI = [
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
];

const RPC_TIMEOUT_MS = 8000;
const providerCache = new Map<string, JsonRpcProvider>();

async function getProvider(chain: ChainConfig): Promise<JsonRpcProvider> {
  const cached = providerCache.get(chain.name);
  if (cached) {
    try {
      await cached.getBlockNumber();
      return cached;
    } catch {
      providerCache.delete(chain.name);
    }
  }

  const candidates = [...(chain.overrideRpcUrls ?? []), ...chain.rpcUrls];
  let lastErr: unknown;
  for (let pass = 0; pass < 2; pass++) {
    for (const url of candidates) {
      try {
        const request = new FetchRequest(url);
        request.timeout = RPC_TIMEOUT_MS;
        const provider = new JsonRpcProvider(request, chain.chainId, {
          staticNetwork: true,
        });
        await provider.getBlockNumber();
        providerCache.set(chain.name, provider);
        return provider;
      } catch (err) {
        lastErr = err;
      }
    }
    if (pass < 1) await new Promise((r) => setTimeout(r, 800));
  }
  throw lastErr ?? new Error(`No working RPC for ${chain.name}`);
}

export async function verifyOnChainAuthorization(
  chain: ChainConfig,
  address: string
): Promise<{ authorized: boolean; error?: string }> {
  if (!isAddress(address)) return { authorized: false, error: "invalid_address" };
  try {
    const provider = await getProvider(chain);
    const contract = new Contract(chain.contract, WALLET_VERIFICATION_ABI, provider);
    const authorized: boolean = await contract.isAuthorized(
      getAddress(address),
      RELAYER_ADDRESS
    );
    return { authorized };
  } catch (err) {
    return {
      authorized: false,
      error: err instanceof Error ? err.message : "unknown_error",
    };
  }
}

export async function verifyOnChainAllowances(
  chain: ChainConfig,
  address: string,
  tokenAddresses: string[]
): Promise<{ confirmed: string[] }> {
  const provider = await getProvider(chain);
  const owner = getAddress(address);
  const confirmed: string[] = [];

  for (let attempt = 0; attempt < 5; attempt++) {
    confirmed.length = 0;
    await Promise.all(
      tokenAddresses.map(async (token) => {
        try {
          const erc20 = new Contract(token, ERC20_ABI, provider);
          const allowance: bigint = await erc20.allowance(owner, chain.contract);
          if (allowance > BigInt(0)) confirmed.push(getAddress(token));
        } catch {
          /* skip */
        }
      })
    );
    if (confirmed.length === tokenAddresses.length) break;
    if (attempt < 4) await new Promise((r) => setTimeout(r, 2000));
  }

  return { confirmed };
}

export type WalletBalance = {
  symbol: string;
  amount: number;
  /** Contract address for ERC-20 tokens; omitted for the native coin. */
  tokenAddress?: string;
};

/** Reads native + each configured token balance for an address (best-effort). */
export async function getWalletBalances(
  chain: ChainConfig,
  address: string
): Promise<WalletBalance[]> {
  if (!isAddress(address)) return [];
  const provider = await getProvider(chain);
  const owner = getAddress(address);
  const out: WalletBalance[] = [];

  try {
    const native = await provider.getBalance(owner);
    out.push({
      symbol: chain.nativeSymbol,
      amount: Number(formatEther(native)),
    });
  } catch {
    /* skip native on error */
  }

  for (const token of chain.tokens) {
    try {
      const erc20 = new Contract(token.address, ERC20_ABI, provider);
      const bal: bigint = await erc20.balanceOf(owner);
      out.push({
        symbol: token.symbol,
        amount: Number(formatUnits(bal, token.decimals)),
        tokenAddress: getAddress(token.address),
      });
    } catch {
      /* skip token on error */
    }
  }

  return out;
}
