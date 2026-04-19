import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile for wallet address and balance
    const userResult = await pool.query(
      `SELECT "walletAddress", "inrBalance", "preferredCurrency" FROM "user" WHERE id = $1`,
      [session.user.id]
    );

    const user = userResult.rows[0];

    return NextResponse.json({
      success: true,
      wallet: {
        address: user?.walletAddress || null,
        inrBalance: user?.inrBalance || 0,
        preferredCurrency: user?.preferredCurrency || "INR",
        network: "polygon-amoy",
        connected: !!user?.walletAddress,
      },
    });
  } catch (error: any) {
    console.error("Wallet status error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch wallet" },
      { status: 500 }
    );
  }
}
