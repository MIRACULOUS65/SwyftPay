/**
 * SwyftPay Settlement Watcher
 * ─────────────────────────────────────────────────────────────────────────────
 * Polls for OrderCreated events on the Router contract block-by-block.
 * Uses eth_getLogs (queryFilter) instead of eth_newFilter — works on all RPCs.
 *
 * Run: node settle.js
 * Keep alive: pm2 start settle.js --name swyftpay-settle
 */

require("dotenv").config();
const { ethers } = require("ethers");
const { Pool }   = require("pg");

// ─── Config ──────────────────────────────────────────────────────────────────
const ROUTER_ADDRESS = "0x96Eb586A63b4a9289acA16031583bd1f625a14f4";
const RPC_URL        = process.env.AMOY_RPC_URL   || "https://rpc-amoy.polygon.technology";
const PRIV_KEY       = process.env.DEPLOYER_PRIVATE_KEY;
const DB_URL         = process.env.DATABASE_URL;
const INR_RATE       = Number(process.env.INR_RATE_PER_AMOY) || 7500;
const POLL_MS        = 5000; // poll every 5 seconds

if (!PRIV_KEY) { console.error("❌ DEPLOYER_PRIVATE_KEY not set"); process.exit(1); }
if (!DB_URL)   { console.error("❌ DATABASE_URL not set");          process.exit(1); }

// ─── Minimal Router ABI ──────────────────────────────────────────────────────
const ROUTER_ABI = [
  {
    inputs: [{ internalType: "bytes32", name: "routerOrderId", type: "bytes32" }],
    name: "settleOrder",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true,  internalType: "bytes32", name: "routerOrderId", type: "bytes32" },
      { indexed: false, internalType: "string",  name: "escrowOrderId", type: "string"  },
      { indexed: true,  internalType: "address", name: "sender",        type: "address" },
      { indexed: true,  internalType: "address", name: "receiver",      type: "address" },
      { indexed: false, internalType: "uint256", name: "grossAmount",   type: "uint256" },
      { indexed: false, internalType: "uint256", name: "netAmount",     type: "uint256" },
      { indexed: false, internalType: "uint256", name: "fee",           type: "uint256" },
      { indexed: false, internalType: "uint8",   name: "currencyType",  type: "uint8"   },
      { indexed: false, internalType: "uint256", name: "inrRate",       type: "uint256" },
      { indexed: false, internalType: "uint256", name: "createdAt",     type: "uint256" },
    ],
    name: "OrderCreated",
    type: "event",
  },
];

// ─── Init ─────────────────────────────────────────────────────────────────────
const pool     = new Pool({ connectionString: DB_URL });
const provider = new ethers.JsonRpcProvider(RPC_URL);
const deployer = new ethers.Wallet(PRIV_KEY, provider);
const router   = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, deployer);

// Prevent double-processing the same order
const processing = new Set();

// ─── Settlement Logic ─────────────────────────────────────────────────────────
async function settle(event) {
  const { routerOrderId, sender, receiver, grossAmount, netAmount, fee } = event.args;

  if (processing.has(routerOrderId)) return;
  processing.add(routerOrderId);

  try {
    const netAMOY   = Number(ethers.formatEther(netAmount));
    const inrCredit = Math.round(netAMOY * INR_RATE * 100) / 100; // always 2dp
    const txHash    = event.transactionHash;

    console.log(`\n▶ Settling order ${routerOrderId.slice(0, 10)}...`);
    console.log(`  Sender:   ${sender}`);
    console.log(`  Receiver: ${receiver}`);
    console.log(`  Net:      ${netAMOY} AMOY → ₹${inrCredit.toFixed(2)}`);
    console.log(`  Tx hash:  ${txHash}`);

    // 1. Look up receiver in DB
    const row          = await pool.query(
      `SELECT id, name FROM "user" WHERE LOWER("walletAddress") = LOWER($1) LIMIT 1`,
      [receiver]
    );
    const receiverUser = row.rows[0] || null;

    // 2. Credit INR balance
    if (receiverUser) {
      await pool.query(
        `UPDATE "user" SET "inrBalance" = "inrBalance" + $1, "updatedAt" = NOW() WHERE id = $2`,
        [inrCredit, receiverUser.id]
      );
      console.log(`  ✅ Credited ₹${inrCredit.toFixed(2)} to ${receiverUser.name}`);
    } else {
      console.log(`  ℹ️  Receiver not in SwyftPay — skipping INR credit`);
    }

    // 3. Call settleOrder on-chain
    const GAS_PRICE = ethers.parseUnits("25", "gwei");
    const tx = await router.settleOrder(routerOrderId, {
      maxFeePerGas:         GAS_PRICE,
      maxPriorityFeePerGas: GAS_PRICE,
    });
    await tx.wait(1);
    console.log(`  ✅ On-chain settled: ${tx.hash}`);

    // 4. Save RECEIVED tx for receiver
    if (receiverUser) {
      await pool.query(
        `INSERT INTO "transaction"
          (id, "userId", type, amount, currency, status, "txHash", "orderId",
           "fromAddress", "toAddress", "counterpartyName", "inrEquivalent",
           "createdAt", "updatedAt")
         VALUES
          (gen_random_uuid()::text, $1, 'RECEIVED', $2, 'AMOY', 'CONFIRMED',
           $3, $4, $5, $6, $7, $8, NOW(), NOW())
         ON CONFLICT DO NOTHING`,
        [
          receiverUser.id,
          netAMOY,
          txHash,
          routerOrderId,
          sender,
          receiver,
          `${sender.slice(0, 6)}...${sender.slice(-4)}`,
          inrCredit,
        ]
      );
    }

    // 5. Mark sender tx SETTLED
    await pool.query(
      `UPDATE "transaction" SET status = 'SETTLED', "updatedAt" = NOW()
       WHERE "orderId" = $1 AND status != 'SETTLED'`,
      [routerOrderId]
    );

    console.log(`  🎉 Done!\n`);
  } catch (err) {
    console.error(`  ❌ Failed for ${routerOrderId.slice(0, 10)}:`, err.message);
  } finally {
    processing.delete(routerOrderId);
  }
}

// ─── Block Poller (replaces contract.on — works on all public RPCs) ───────────
async function poll(fromBlock, toBlock) {
  try {
    // queryFilter uses eth_getLogs — universally supported
    const events = await router.queryFilter("OrderCreated", fromBlock, toBlock);
    for (const event of events) {
      await settle(event);
    }
  } catch (err) {
    // Silently ignore range errors (RPC may limit block range)
    if (!err.message?.includes("range")) {
      console.error("  [poll error]", err.message);
    }
  }
}

// ─── Main Loop ────────────────────────────────────────────────────────────────
async function start() {
  const network = await provider.getNetwork();
  const balance = await provider.getBalance(deployer.address);

  console.log("═══════════════════════════════════════════════════════");
  console.log("  SWYFTPAY Settlement Watcher — Starting");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`  Network:  Chain ID ${network.chainId}`);
  console.log(`  Deployer: ${deployer.address}`);
  console.log(`  Balance:  ${ethers.formatEther(balance)} AMOY`);
  console.log(`  Router:   ${ROUTER_ADDRESS}`);
  console.log(`  INR rate: ₹${INR_RATE}/AMOY`);
  console.log(`  Mode:     Block polling (eth_getLogs) every ${POLL_MS/1000}s`);
  console.log("═══════════════════════════════════════════════════════\n");
  console.log("  👂 Watching for OrderCreated events...\n");

  let lastBlock = await provider.getBlockNumber();

  const loop = setInterval(async () => {
    try {
      const currentBlock = await provider.getBlockNumber();
      if (currentBlock <= lastBlock) return;

      await poll(lastBlock + 1, currentBlock);
      lastBlock = currentBlock;
    } catch (err) {
      console.error("  [loop error]", err.message);
    }
  }, POLL_MS);

  // Graceful shutdown
  const shutdown = () => {
    console.log("\n👋 Shutting down...");
    clearInterval(loop);
    pool.end();
    process.exit(0);
  };
  process.on("SIGINT",  shutdown);
  process.on("SIGTERM", shutdown);
}

start().catch(err => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
