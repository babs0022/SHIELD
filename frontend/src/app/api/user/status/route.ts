import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { jwtVerify } from 'jose';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);

    let decodedToken;
    try {
      const { payload } = await jwtVerify(token, secret);
      decodedToken = payload;
    } catch (jwtError) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const wallet_address = decodedToken.address as string;

    const users = await sql`
      SELECT tier, daily_link_count, last_link_creation_date, subscription_expires_at
      FROM users
      WHERE wallet_address = ${wallet_address}
    `;

    let user = users[0];

    // If user doesn't exist, create a free tier user record
    if (!user) {
      await sql`
        INSERT INTO users (address, tier, daily_link_count, last_link_creation_date)
        VALUES (${address}, 'free', 0, ${new Date().toISOString().split('T')[0]})
      `;
      const newUser = await sql`
        SELECT tier, daily_link_count, last_link_creation_date, subscription_expires_at
        FROM users
        WHEREwallet_address = ${address}
      `;
      user = newUser[0];
    }

    const now = new Date();
    const lastCreation = user.last_link_creation_date ? new Date(user.last_link_creation_date) : null;
    let dailyCount = user.daily_link_count;

    // Check if a day (24 hours) has passed since the last link creation
    if (lastCreation && (now.getTime() - lastCreation.getTime()) > 24 * 60 * 60 * 1000) {
        if (dailyCount > 0) {
            await sql`
                UPDATE users
                SET daily_link_count = 0, last_link_creation_date = ${now}
                WHERE wallet_address = ${wallet_address}
            `;
            dailyCount = 0;
        }
    }

    return NextResponse.json({
      tier: user.tier,
      dailyLinkCount: dailyCount,
      subscriptionExpiresAt: user.subscription_expires_at,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: 'Failed to fetch user status.', details: errorMessage }, { status: 500 });
  }
}