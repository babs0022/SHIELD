import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { SUPER_ADMIN_ADDRESSES, TEAM_ADMIN_ADDRESSES } from '@/config/admin';
import { jwtVerify } from 'jose';
import { z } from 'zod';
import { isAddress } from 'viem';

// Zod schema for strict input validation
const upgradeSchema = z.object({
  userAddress: z.string().refine(isAddress, { message: "Invalid Ethereum address" }),
  durationInDays: z.number().int().positive({ message: "Duration must be a positive number of days" }),
});

const isAdmin = (address: string | null | undefined) => {
  if (!address) return false;
  const lowerCaseAddress = address.toLowerCase();
  return (
    SUPER_ADMIN_ADDRESSES.map(addr => addr.toLowerCase()).includes(lowerCaseAddress) ||
    TEAM_ADMIN_ADDRESSES.map(addr => addr.toLowerCase()).includes(lowerCaseAddress)
  );
};

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Authenticate the admin
    if (!process.env.JWT_SECRET) {
      console.error('API Error: JWT_SECRET is not defined.');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const adminWalletAddress = payload.address as string;

    if (!isAdmin(adminWalletAddress)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Validate the request body
    const body = await req.json();
    const validation = upgradeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input.", details: validation.error.flatten() }, { status: 400 });
    }
    const { userAddress, durationInDays } = validation.data;

    // 3. Perform the upgrade logic
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + durationInDays);

    // Use an "upsert" operation: 
    // If the user exists, update their tier and expiry.
    // If they don't exist, create them with the pro tier and expiry.
    await sql`
      INSERT INTO users (wallet_address, tier, subscription_expires_at, daily_link_count, last_link_creation_date)
      VALUES (${userAddress}, 'pro', ${expiryDate.toISOString()}, 0, NOW())
      ON CONFLICT (wallet_address)
      DO UPDATE SET
        tier = 'pro',
        subscription_expires_at = ${expiryDate.toISOString()};
    `;

    return NextResponse.json({ success: true, message: `Successfully upgraded ${userAddress} to Pro for ${durationInDays} days.` });

  } catch (error) {
    console.error('Error in /api/admin/upgrade:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
