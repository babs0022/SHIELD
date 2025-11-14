import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { SUPER_ADMIN_ADDRESSES, TEAM_ADMIN_ADDRESSES } from '@/config/admin';
import { getAuth } from '@clerk/nextjs/server';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

// Helper to check if an address is an admin
const isAdmin = (address: string | null | undefined) => {
  if (!address) return false;
  const lowerCaseAddress = address.toLowerCase();
  return (
    SUPER_ADMIN_ADDRESSES.map(addr => addr.toLowerCase()).includes(lowerCaseAddress) ||
    TEAM_ADMIN_ADDRESSES.map(addr => addr.toLowerCase()).includes(lowerCaseAddress)
  );
};

export async function GET(req: NextRequest) {
  const { userId, sessionClaims } = getAuth(req);

  if (!userId || !sessionClaims?.public_metadata?.wallet_address) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userWalletAddress = sessionClaims.public_metadata.wallet_address as string;

  if (!isAdmin(userWalletAddress)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM policies ORDER BY created_at DESC');
    client.release();
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching policies:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { userId, sessionClaims } = getAuth(req);

  if (!userId || !sessionClaims?.public_metadata?.wallet_address) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userWalletAddress = sessionClaims.public_metadata.wallet_address as string;

  if (!isAdmin(userWalletAddress)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { policyId, action } = await req.json();

  if (!policyId || action !== 'revoke') {
    return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
  }

  try {
    const client = await pool.connect();
    // Assuming 'status' column exists in 'policies' table
    await client.query('UPDATE policies SET status = $1 WHERE policy_id = $2', ['revoked', policyId]);
    client.release();
    return NextResponse.json({ message: `Policy ${policyId} revoked successfully` });
  } catch (error) {
    console.error(`Error revoking policy ${policyId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
