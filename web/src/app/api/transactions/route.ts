import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ─── GET: fetch transactions for current user ─────────────────────────────────
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const result = await pool.query(
      `SELECT * FROM "transaction" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 50`,
      [session.user.id]
    );
    return NextResponse.json({ success: true, transactions: result.rows });
  } catch (error: any) {
    console.error("Transactions GET error:", error);
    return NextResponse.json({ success: true, transactions: [] });
  }
}

// ─── POST: save a new transaction after on-chain confirmation ─────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      type,           // "SENT" | "RECEIVED"
      amount,         // in AMOY
      currency = "AMOY",
      txHash,
      orderId,
      fromAddress,
      toAddress,
      counterpartyName = "Unknown",
      inrEquivalent = 0,
      gasCost,
      status = "CONFIRMED",
    } = body;

    if (!type || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO "transaction"
        (id, "userId", type, amount, currency, status, "txHash", "orderId",
         "fromAddress", "toAddress", "counterpartyName", "inrEquivalent", "gasCost",
         "createdAt", "updatedAt")
       VALUES
        (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
       RETURNING *`,
      [
        session.user.id,
        type,
        amount,
        currency,
        status,
        txHash || null,
        orderId || null,
        fromAddress || null,
        toAddress || null,
        counterpartyName,
        inrEquivalent,
        gasCost || null,
      ]
    );

    return NextResponse.json({ success: true, transaction: result.rows[0] });
  } catch (error: any) {
    console.error("Transactions POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
