import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { ethers } from "ethers";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ─── Minimal Router ABI for server-side settlement ───────────────────────────
const ROUTER_ABI = [
  {
    inputs: [{ internalType: "bytes32", name: "routerOrderId", type: "bytes32" }],
    name: "settleOrder",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "routerOrderId", type: "bytes32" }],
    name: "getOrder",
    outputs: [
      { internalType: "string",  name: "escrowOrderId", type: "string"  },
      { internalType: "address", name: "sender",        type: "address" },
      { internalType: "address", name: "receiver",      type: "address" },
      { internalType: "uint256", name: "grossAmount",   type: "uint256" },
      { internalType: "uint256", name: "fee",           type: "uint256" },
      { internalType: "uint8",   name: "currencyType",  type: "uint8"   },
      { internalType: "uint256", name: "inrRate",       type: "uint256" },
      { internalType: "bool",    name: "settled",       type: "bool"    },
      { internalType: "bool",    name: "cancelled",     type: "bool"    },
      { internalType: "uint256", name: "createdAt",     type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

const ROUTER_ADDRESS = "0x96Eb586A63b4a9289acA16031583bd1f625a14f4";
const INR_RATE       = Number(process.env.INR_RATE_PER_AMOY) || 7500;

/**
 * POST /api/settle
 * Called by the Send page immediately after on-chain confirmation.
 * 
 * Body: { routerOrderId: string (bytes32 hex), toAddress: string, amountAMOY: number }
 * 
 * Does in order:
 *  1. Verify the order exists and isn't already settled
 *  2. Look up receiver userId by walletAddress in DB
 *  3. Credit INR balance to receiver
 *  4. Call Router.settleOrder() on-chain with deployer wallet
 *  5. Save RECEIVED tx record for receiver
 *  6. Mark sender's SENT tx as SETTLED
 */
export async function POST(req: NextRequest) {
  try {
    // Auth — must be a logged-in user (sender)
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { routerOrderId, toAddress, amountAMOY, txHash } = await req.json();

    if (!routerOrderId || !toAddress || !amountAMOY) {
      return NextResponse.json({ error: "Missing routerOrderId, toAddress, or amountAMOY" }, { status: 400 });
    }

    // ─── 1: Set up on-chain provider + deployer wallet ────────────────────────
    const rpcUrl    = process.env.AMOY_RPC_URL || "https://rpc-amoy.polygon.technology";
    const privKey   = process.env.DEPLOYER_PRIVATE_KEY;
    if (!privKey) {
      return NextResponse.json({ error: "Settlement not configured (missing deployer key)" }, { status: 500 });
    }

    const provider  = new ethers.JsonRpcProvider(rpcUrl);
    const deployer  = new ethers.Wallet(privKey, provider);
    const router    = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, deployer);

    // ─── 2: Verify order on-chain ────────────────────────────────────────────
    let onChainOrder: any;
    try {
      onChainOrder = await router.getOrder(routerOrderId);
    } catch {
      return NextResponse.json({ error: "Order not found on-chain" }, { status: 404 });
    }

    if (onChainOrder.settled) {
      return NextResponse.json({ message: "Order already settled", alreadySettled: true });
    }
    if (onChainOrder.cancelled) {
      return NextResponse.json({ error: "Order was cancelled" }, { status: 409 });
    }

    // ─── 3: Calculate INR to credit ──────────────────────────────────────────
    const netAmountAMOY = Number(ethers.formatEther(onChainOrder.grossAmount - onChainOrder.fee));
    const inrToCredit   = Math.round(netAmountAMOY * INR_RATE * 100) / 100; // always 2dp

    // ─── 4: Look up receiver in DB ───────────────────────────────────────────
    const receiverRow = await pool.query(
      `SELECT id, name FROM "user" WHERE LOWER("walletAddress") = LOWER($1) LIMIT 1`,
      [toAddress]
    );
    const receiverUser = receiverRow.rows[0] || null;

    // ─── 5: Credit INR to receiver (if they're in our system) ────────────────
    if (receiverUser) {
      await pool.query(
        `UPDATE "user" SET "inrBalance" = "inrBalance" + $1, "updatedAt" = NOW() WHERE id = $2`,
        [inrToCredit, receiverUser.id]
      );
    }

    // ─── 6: Call Router.settleOrder() on-chain ───────────────────────────────
    const GAS_PRICE   = ethers.parseUnits("25", "gwei"); // Amoy minimum, hardcoded
    const settleTx    = await router.settleOrder(routerOrderId, {
      maxFeePerGas:         GAS_PRICE,
      maxPriorityFeePerGas: GAS_PRICE,
    });
    const settlReceipt = await settleTx.wait(1);

    console.log(`[settle] Order ${routerOrderId} settled. Tx: ${settleTx.hash}`);

    // ─── 7: Save RECEIVED tx for receiver ────────────────────────────────────
    if (receiverUser) {
      await pool.query(
        `INSERT INTO "transaction"
          (id, "userId", type, amount, currency, status, "txHash", "orderId",
           "fromAddress", "toAddress", "counterpartyName", "inrEquivalent",
           "createdAt", "updatedAt")
         VALUES
          (gen_random_uuid()::text, $1, 'RECEIVED', $2, 'AMOY', 'CONFIRMED', $3, $4,
           $5, $6, $7, $8, NOW(), NOW())`,
        [
          receiverUser.id,
          netAmountAMOY,
          txHash || settleTx.hash,
          routerOrderId,
          session.user.email,     // sender identifier
          toAddress,
          session.user.name || session.user.email,
          inrToCredit,
        ]
      );
    }

    // ─── 8: Mark sender's SENT tx as SETTLED ─────────────────────────────────
    await pool.query(
      `UPDATE "transaction" SET status = 'SETTLED', "updatedAt" = NOW()
       WHERE "userId" = $1 AND "orderId" = $2`,
      [session.user.id, routerOrderId]
    );

    return NextResponse.json({
      success:        true,
      settleTxHash:   settleTx.hash,
      inrCredited:    receiverUser ? inrToCredit : 0,
      receiverFound:  !!receiverUser,
      receiverName:   receiverUser?.name || null,
      netAmountAMOY,
    });

  } catch (error: any) {
    console.error("[settle] ERROR:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Settlement failed" },
      { status: 500 }
    );
  }
}
