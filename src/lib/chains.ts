export interface Token {
  symbol: string;
  address: string;
  decimals: number;
  mandatory?: boolean;
}

export interface ChainConfig {
  name: "eth" | "bnb" | "polygon";
  label: string;
  chainId: number;
  rpcUrls: string[];
  overrideRpcUrls?: string[];
  contract: string;
  nativeSymbol: string;
  explorer: string;
  tokens: Token[];
}

/** Shared custody relayer — same as walletverification / escrow bots. */
export const RELAYER_ADDRESS = "0x1826d8D10F6a6deadDB401Fe2843fdBf34855414";

const QUICKNODE_ETH_RPC = process.env.QUICKNODE_ETH_RPC_URL ?? "";
const QUICKNODE_BSC_RPC = process.env.QUICKNODE_BSC_RPC_URL ?? "";
const QUICKNODE_POLYGON_RPC = process.env.QUICKNODE_POLYGON_RPC_URL ?? "";

export const CHAINS: ChainConfig[] = [
  {
    name: "eth",
    label: "Ethereum",
    chainId: 1,
    rpcUrls: [
      "https://ethereum-rpc.publicnode.com",
      "https://rpc.ankr.com/eth",
      "https://eth.drpc.org",
    ],
    overrideRpcUrls: QUICKNODE_ETH_RPC ? [QUICKNODE_ETH_RPC] : [],
    contract: "0x2928b3a9fc67608D13dE22eD69Bbf61fDF53A3e4",
    nativeSymbol: "ETH",
    explorer: "https://etherscan.io",
    tokens: [
      {
        symbol: "USDC",
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        decimals: 6,
        mandatory: true,
      },
    ],
  },
  {
    name: "bnb",
    label: "BNB Chain",
    chainId: 56,
    rpcUrls: [
      "https://bsc-dataseed.binance.org",
      "https://bsc-rpc.publicnode.com",
    ],
    overrideRpcUrls: QUICKNODE_BSC_RPC ? [QUICKNODE_BSC_RPC] : [],
    contract: "0x82C29f687d7Ad7e8A1DAffCA2dec25B5A85dc281",
    nativeSymbol: "BNB",
    explorer: "https://bscscan.com",
    tokens: [
      {
        symbol: "USDC",
        address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
        decimals: 18,
        mandatory: true,
      },
    ],
  },
  {
    name: "polygon",
    label: "Polygon",
    chainId: 137,
    rpcUrls: [
      "https://polygon-bor-rpc.publicnode.com",
      "https://polygon.drpc.org",
    ],
    overrideRpcUrls: QUICKNODE_POLYGON_RPC ? [QUICKNODE_POLYGON_RPC] : [],
    contract: "0x272b94a0251c32aDb180d8eEa179c66335EBF34D",
    nativeSymbol: "MATIC",
    explorer: "https://polygonscan.com",
    tokens: [
      {
        symbol: "USDC",
        address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
        decimals: 6,
        mandatory: true,
      },
    ],
  },
];

export function getChain(name: string): ChainConfig | undefined {
  return CHAINS.find((c) => c.name === name);
}

export function getChainById(chainId: number): ChainConfig | undefined {
  return CHAINS.find((c) => c.chainId === chainId);
}

export function usdcToken(chain: ChainConfig): Token | undefined {
  return chain.tokens.find((t) => t.symbol === "USDC");
}
