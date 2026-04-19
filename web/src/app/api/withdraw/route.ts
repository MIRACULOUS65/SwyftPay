import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const ADMIN_UPI = process.env.ADMIN_UPI_ID || "8336885355@upi";
const RAZORPAY_KEY_ID     = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const DEMO_MODE = !RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET;

/** Simulated payout — returns a fake Razorpay payout ID for demo */
function simulatePayout(upiId: string, amount: number) {
  const fakeId = `pout_demo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  console.log(`[withdraw][DEMO] Simulating payout of ₹${amount} → ${upiId}. ID: ${fakeId}`);
  return { id: fakeId, status: "processed" };
}

/** Real Razorpay Payout API */
async function razorpayPayout(upiId: string, amountPaise: number, reference: string) {
  const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");

  // Step 1: Create Contact
  const contactRes = await fetch("https://api.razorpay.com/v1/contacts", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: "SwyftPay User", type: "customer", reference_id: reference }),
  });
  const contact = await contactRes.json();
  if (!contact.id) throw new Error(`Contact creation failed: ${JSON.stringify(contact)}`);

  // Step 2: Create Fund Account
  const faRes = await fetch("https://api.razorpay.com/v1/fund_accounts", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      contact_id:   contact.id,
      account_type: "vpa",
      vpa:          { address: upiId },
    }),
  });
  const fa = await faRes.json();
  if (!fa.id) throw new Error(`Fund account creation failed: ${JSON.stringify(fa)}`);

  // Step 3: Create Payout
  const payoutRes = await fetch("https://api.razorpay.com/v1/payouts", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json", "X-Payout-Idempotency": reference },
    body: JSON.stringify({
      account_number: process.env.RAZORPAY_ACCOUNT_NUMBER,
      fund_account_id: fa.id,
      amount:          amountPaise, // in paise
      currency:        "INR",
      mode:            "UPI",
      purpose:         "payout",
      queue_if_low_balance: true,
      reference_id:    reference,
      narration:       `SwyftPay withdrawal to ${upiId}`,
    }),
  });
  const payout = await payoutRes.json();
  if (!payout.id) throw new Error(`Payout creation failed: ${JSON.stringify(payout)}`);
  return payout;
}

/**
 * POST /api/withdraw
 * Body: { upiId: string, amount: number }
 *
 * Flow:
 *  1. Validate session + sufficient inrBalance
 *  2. Deduct inrBalance in DB (pessimistic — deduct first, rollback on failure)
 *  3. Trigger Razorpay payout (or simulate)
 *  4. Save WITHDRAWAL tx record
 *  5. On Razorpay failure → restore inrBalance
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { upiId, amount } = await req.json();

    if (!upiId || !amount || Number(amount) <= 0) {
      return NextResponse.json({ error: "Invalid UPI ID or amount" }, { status: 400 });
    }

    // Basic UPI format: xxxxx@yyy
    if (!/^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/.test(upiId)) {
      return NextResponse.json({ error: "Invalid UPI ID format (e.g. name@upi)" }, { status: 400 });
    }

    const amountNum = parseFloat(amount);

    // ─── 1: Check balance ─────────────────────────────────────────────────────
    const userRow = await pool.query(
      `SELECT "inrBalance" FROM "user" WHERE id = $1`,
      [session.user.id]
    );
    const currentBalance = parseFloat(userRow.rows[0]?.inrBalance || "0");

    if (currentBalance < amountNum) {
      return NextResponse.json({ error: `Insufficient balance. Available: ₹${currentBalance.toFixed(2)}` }, { status: 400 });
    }

    // ─── 2: Deduct balance ────────────────────────────────────────────────────
    await pool.query(
      `UPDATE "user" SET "inrBalance" = "inrBalance" - $1, "updatedAt" = NOW() WHERE id = $2`,
      [amountNum, session.user.id]
    );

    // ─── 3: Trigger payout ────────────────────────────────────────────────────
    const reference = `swyft_${session.user.id.slice(0, 8)}_${Date.now()}`;
    let payoutId  = "";
    let payoutStatus = "processed";

    try {
      if (DEMO_MODE) {
        const result = simulatePayout(upiId, amountNum);
        payoutId     = result.id;
        payoutStatus = result.status;
      } else {
        const amountPaise = Math.round(amountNum * 100); // ₹ → paise
        const result = await razorpayPayout(upiId, amountPaise, reference);
        payoutId     = result.id;
        payoutStatus = result.status;
      }
    } catch (payoutErr: any) {
      // ─── Rollback balance on payout failure ───────────────────────────────
      await pool.query(
        `UPDATE "user" SET "inrBalance" = "inrBalance" + $1, "updatedAt" = NOW() WHERE id = $2`,
        [amountNum, session.user.id]
      );
      console.error("[withdraw] Payout failed, balance restored:", payoutErr.message);
      return NextResponse.json({ error: `Payout failed: ${payoutErr.message}` }, { status: 502 });
    }

    // ─── 4: Save WITHDRAWAL tx ────────────────────────────────────────────────
    await pool.query(
      `INSERT INTO "transaction"
        (id, "userId", type, amount, currency, status, "orderId",
         "counterpartyName", "inrEquivalent", "createdAt", "updatedAt")
       VALUES
        (gen_random_uuid()::text, $1, 'WITHDRAWAL', $2, 'INR', 'CONFIRMED',
         $3, $4, $2, NOW(), NOW())`,
      [
        session.user.id,
        amountNum,
        payoutId,
        upiId,
      ]
    );

    // Fetch updated balance
    const updatedRow = await pool.query(
      `SELECT "inrBalance" FROM "user" WHERE id = $1`,
      [session.user.id]
    );

    return NextResponse.json({
      success:     true,
      payoutId,
      payoutStatus,
      adminUpi:    ADMIN_UPI,
      toUpi:       upiId,
      amount:      amountNum,
      newBalance:  parseFloat(updatedRow.rows[0].inrBalance),
      demo:        DEMO_MODE,
    });

  } catch (error: any) {
    console.error("[withdraw] ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
