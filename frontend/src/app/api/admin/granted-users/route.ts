import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { SUPER_ADMIN_ADDRESSES, TEAM_ADMIN_ADDRESSES } from '@/config/admin';
import { jwtVerify } from 'jose';

const isAdmin = (address: string | null | undefined) => {
  if (!address) return false;
  const lowerCaseAddress = address.toLowerCase();
  return (
    SUPER_ADMIN_ADDRESSES.map(addr => addr.toLowerCase()).includes(lowerCaseAddress) ||
    TEAM_ADMIN_ADDRESSES.map(addr => addr.toLowerCase()).includes(lowerCaseAddress)
  );
};

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!process.env.JWT_SECRET) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userWalletAddress = payload.address as string;

    if (!isAdmin(userWalletAddress)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // For now, this will fetch all Pro users.
    // In the future, this query would be modified to exclude users with a payment record.
    const grantedUsers = await sql`
      SELECT wallet_address, subscription_expires_at
      FROM users
      WHERE tier = 'pro' AND subscription_expires_at IS NOT NULL
      ORDER BY subscription_expires_at DESC
    `;

    return NextResponse.json(grantedUsers);

  } catch (error) {
    console.error('Error fetching granted pro users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
