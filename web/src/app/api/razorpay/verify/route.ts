import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createHmac } from "crypto";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * POST /api/razorpay/verify
 * Called after Razorpay checkout success. Verifies signature,
 * deducts inrBalance, saves WITHDRAWAL transaction.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,  // in ₹ (not paise)
      upiId,
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
    }

    // ── Verify signature (prevents fake payment callbacks) ───────────────────
    const body    = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex");

    if (expected !== razorpay_signature) {
      console.error("[razorpay/verify] Signature mismatch — possible fraud");
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    const amountNum = parseFloat(amount);

    // ── Check balance ─────────────────────────────────────────────────────────
    const userRow = await pool.query(
      `SELECT "inrBalance" FROM "user" WHERE id = $1`,
      [session.user.id]
    );
    const currentBalance = parseFloat(userRow.rows[0]?.inrBalance || "0");
    if (currentBalance < amountNum) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    // ── Deduct balance ────────────────────────────────────────────────────────
    await pool.query(
      `UPDATE "user" SET "inrBalance" = "inrBalance" - $1, "updatedAt" = NOW() WHERE id = $2`,
      [amountNum, session.user.id]
    );

    // ── Save WITHDRAWAL tx ────────────────────────────────────────────────────
    await pool.query(
      `INSERT INTO "transaction"
        (id, "userId", type, amount, currency, status, "orderId",
         "counterpartyName", "inrEquivalent", "createdAt", "updatedAt")
       VALUES
        (gen_random_uuid()::text, $1, 'WITHDRAWAL', $2, 'INR', 'CONFIRMED',
         $3, $4, $2, NOW(), NOW())`,
      [session.user.id, amountNum, razorpay_payment_id, upiId]
    );

    const updatedRow = await pool.query(
      `SELECT "inrBalance" FROM "user" WHERE id = $1`,
      [session.user.id]
    );

    console.log(`[razorpay/verify] ✅ Payment ${razorpay_payment_id} verified. ₹${amountNum} deducted from ${session.user.id}`);

    return NextResponse.json({
      success:    true,
      paymentId:  razorpay_payment_id,
      orderId:    razorpay_order_id,
      amount:     amountNum,
      upiId,
      newBalance: parseFloat(updatedRow.rows[0].inrBalance),
    });

  } catch (err: any) {
    console.error("[razorpay/verify] ERROR:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
