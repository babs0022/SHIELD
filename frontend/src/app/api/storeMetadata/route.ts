import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { z } from 'zod';

const metadataSchema = z.object({
  policyId: z.string(),
  creatorId: z.string(),
  contentCid: z.string(),
  recipientAddress: z.string(),
  mimeType: z.string().optional(),
  isText: z.boolean(),
  expiry: z.string(),
  maxAttempts: z.string(),
  contentLength: z.number().optional(), // Expecting content length from the client
});

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const validation = metadataSchema.safeParse(data);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input.", details: validation.error.flatten() }, { status: 400 });
    }

    const {
      policyId,
      creatorId,
      contentCid,
      recipientAddress,
      mimeType,
      isText,
      expiry,
      maxAttempts,
      contentLength,
    } = validation.data;

    const users = await sql`SELECT tier, daily_link_count, last_link_creation_date, subscription_expires_at FROM users WHERE wallet_address = ${creatorId}`;
    let user = users[0];

    // If user doesn't exist, create a free tier user record.
    if (!user) {
      await sql`INSERT INTO users (wallet_address, tier, daily_link_count, last_link_creation_date) VALUES (${creatorId}, 'free', 0, ${new Date()})`;
      const newUser = await sql`SELECT tier, daily_link_count, last_link_creation_date, subscription_expires_at FROM users WHERE wallet_address = ${creatorId}`;
      user = newUser[0];
    }
    
    const dailyCount = user.daily_link_count;

    const tierLimits = {
        free: { daily: 5, fileSize: 20 * 1024 * 1024, textChars: 500, multiFile: false },
        pro: { daily: 50, fileSize: 100 * 1024 * 1024, textChars: Infinity, multiFile: true }
    };

    const limits = tierLimits[user.tier] || tierLimits.free; // Default to free if tier is not set

    if (dailyCount >= limits.daily) {
        return NextResponse.json({ error: "You have reached your daily limit for creating links. Upgrade to Pro for more!" }, { status: 429 });
    }

    if (isText && contentLength && contentLength > limits.textChars) {
        return NextResponse.json({ error: `Text content exceeds the limit of ${limits.textChars} characters for your tier. Upgrade to Pro!` }, { status: 413 });
    }

    if (!isText && contentLength && contentLength > limits.fileSize) {
        return NextResponse.json({ error: `File size exceeds the limit of ${limits.fileSize / 1024 / 1024}MB for your tier. Upgrade to Pro!` }, { status: 413 });
    }

    const expiryTimestamp = Math.floor(Date.now() / 1000) + parseInt(expiry, 10);

    await sql`
      INSERT INTO policies (policy_id, creator_id, resource_cid, recipient_address, mime_type, is_text, expiry, max_attempts, attempts, valid, status, content_length)
      VALUES (${policyId}, ${creatorId}, ${contentCid}, ${recipientAddress}, ${mimeType}, ${isText}, ${expiryTimestamp}, ${parseInt(maxAttempts, 10)}, ${0}, ${true}, ${'active'}, ${contentLength})
    `;

    await sql`
      UPDATE users 
      SET daily_link_count = daily_link_count + 1, last_link_creation_date = ${new Date()}
      WHERE wallet_address = ${creatorId}
    `;

    const baseUrl = process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL
      : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    const link = `${baseUrl}/r/${policyId}`;
    return NextResponse.json({ success: true, link });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json({ error: "Failed to store metadata.", details: errorMessage }, { status: 500 });
  }
}
