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

    try {
      const users = await sql`
        SELECT tier, daily_link_count, last_link_creation_date, subscription_expires_at
        FROM users
        WHERE wallet_address = ${wallet_address}
      `;

      if (users.length === 0) {
        // Create a new user if one doesn't exist
        await sql`
          INSERT INTO users (wallet_address, tier, daily_link_count, last_link_creation_date, subscription_expires_at)
          VALUES (${wallet_address}, 'free', 0, ${new Date().toISOString()}, NULL)
        `;
        return NextResponse.json({
          tier: 'free',
          dailyLinkCount: 0,
          subscriptionExpiresAt: null,
        });
      }

      const user = users[0];
      const now = new Date();

      // Check if subscription is expired and downgrade if necessary
      if (user.tier === 'pro' && user.subscription_expires_at) {
        const expiryDate = new Date(user.subscription_expires_at);
        if (now > expiryDate) {
          await sql`
            UPDATE users
            SET tier = 'free', subscription_expires_at = NULL
            WHERE wallet_address = ${wallet_address}
          `;
          user.tier = 'free'; // Update the user object for the response
        }
      }

      const lastCreation = user.last_link_creation_date ? new Date(user.last_link_creation_date) : null;
      // Check if a day (24 hours) has passed since the last link creation
      if (lastCreation && (now.getTime() - lastCreation.getTime()) > 24 * 60 * 60 * 1000) {
        if (user.daily_link_count > 0) {
          await sql`
            UPDATE users
            SET daily_link_count = 0, last_link_creation_date = ${now.toISOString()}
            WHERE wallet_address = ${wallet_address}
          `;
          user.daily_link_count = 0;
        }
      }

      return NextResponse.json({
        tier: user.tier,
        dailyLinkCount: user.daily_link_count,
        subscriptionExpiresAt: user.subscription_expires_at,
      });
    } catch (dbError) {
      const errorMessage = dbError instanceof Error ? dbError.message : 'A database error occurred.';
      return NextResponse.json({ error: 'Failed to fetch user status.', details: errorMessage }, { status: 500 });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: 'Failed to fetch user status.', details: errorMessage }, { status: 500 });
  }
}
