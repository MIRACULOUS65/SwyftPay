import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { walletAddress } = body;

    if (!walletAddress || typeof walletAddress !== "string") {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
    }

    // Check if wallet is already linked to another account
    const existing = await pool.query(
      `SELECT id FROM "user" WHERE "walletAddress" = $1 AND id != $2`,
      [walletAddress.toLowerCase(), session.user.id]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "This wallet is already linked to another account" },
        { status: 409 }
      );
    }

    // Update the user's wallet address
    await pool.query(
      `UPDATE "user" SET "walletAddress" = $1 WHERE id = $2`,
      [walletAddress.toLowerCase(), session.user.id]
    );

    return NextResponse.json({
      success: true,
      walletAddress: walletAddress.toLowerCase(),
    });
  } catch (error: any) {
    console.error("Wallet link error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to link wallet" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await pool.query(
      `SELECT "walletAddress" FROM "user" WHERE id = $1`,
      [session.user.id]
    );

    return NextResponse.json({
      success: true,
      walletAddress: result.rows[0]?.walletAddress || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to get wallet" },
      { status: 500 }
    );
  }
}
