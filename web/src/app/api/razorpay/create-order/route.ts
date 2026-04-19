import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * POST /api/razorpay/create-order
 * Creates a Razorpay order for the withdrawal flow.
 * Returns { orderId, keyId, amount, currency } to the frontend,
 * which opens the Razorpay checkout popup.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { amount, upiId } = await req.json();
    if (!amount || Number(amount) <= 0 || !upiId) {
      return NextResponse.json({ error: "Invalid amount or UPI ID" }, { status: 400 });
    }

    const amountPaise = Math.round(Number(amount) * 100); // ₹ → paise

    // ── Create Razorpay order via REST (avoids Edge runtime issues with SDK) ──
    const credentials = Buffer.from(
      `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
    ).toString("base64");

    const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount:   amountPaise,
        currency: "INR",
        receipt:  `swyft_${session.user.id.slice(0, 8)}_${Date.now()}`,
        notes: {
          userId: session.user.id,
          upiId,
          purpose: "SwyftPay INR Withdrawal",
        },
      }),
    });

    const order = await orderRes.json();
    if (!order.id) {
      console.error("[razorpay/create-order] Failed:", order);
      return NextResponse.json(
        { error: order.error?.description || "Failed to create order" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      orderId:  order.id,
      keyId:    process.env.RAZORPAY_KEY_ID,
      amount:   amountPaise,
      currency: "INR",
      name:     session.user.name || "SwyftPay User",
      upiId,
    });
  } catch (err: any) {
    console.error("[razorpay/create-order] ERROR:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
