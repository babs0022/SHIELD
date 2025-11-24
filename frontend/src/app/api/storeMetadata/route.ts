import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const {
      policyId,
      creatorId,
      contentCid,
      recipientAddress,
      secretKey,
      mimeType,
      isText,
      expiry,
      maxAttempts,
    } = data;

    if (!policyId || !creatorId || !contentCid || !recipientAddress || !secretKey) {
      return NextResponse.json({ error: "Missing required metadata." }, { status: 400 });
    }

    const expiryTimestamp = Math.floor(Date.now() / 1000) + parseInt(expiry, 10);

    const client = await pool.connect();
    try {
      await client.query(
        `INSERT INTO policies (policy_id, creator_id, resource_cid, recipient_address, secret_key, mime_type, is_text, expiry, max_attempts, attempts, valid)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          policyId,
          creatorId,
          contentCid,
          recipientAddress,
          secretKey,
          mimeType,
          isText,
          expiryTimestamp,
          parseInt(maxAttempts, 10),
          0,
          true,
        ]
      );
    } finally {
      client.release();
    }

    const baseUrl = process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL
      : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    const link = `${baseUrl}/r/${policyId}`;
    return NextResponse.json({ success: true, link });

  } catch (error) {
    console.error("Error in /api/storeMetadata:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json({ error: "Failed to store metadata.", details: errorMessage }, { status: 500 });
  }
}
