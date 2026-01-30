import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { jwtVerify } from 'jose';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
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

    // Calculate expiry date (e.g., 30 days from now)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    await sql`
      UPDATE users
      SET tier = 'pro', subscription_expires_at = ${expiryDate.toISOString()}
      WHERE wallet_address = ${wallet_address}
    `;

    return NextResponse.json({ success: true, message: 'Successfully upgraded to Pro tier!' });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: 'Failed to upgrade tier.', details: errorMessage }, { status: 500 });
  }
}