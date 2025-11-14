import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { SUPER_ADMIN_ADDRESSES, TEAM_ADMIN_ADDRESSES } from '@/config/admin';
import jwt from 'jsonwebtoken';

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
  const token = req.headers.get('authorization')?.split(' ')[1];
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (typeof decoded === 'string' || !decoded.address) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token payload' }, { status: 401 });
    }
    const userWalletAddress = decoded.address as string;

    if (!isAdmin(userWalletAddress)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
  const token = req.headers.get('authorization')?.split(' ')[1];
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let policyId: string | undefined;
  let action: string | undefined;

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (typeof decoded === 'string' || !decoded.address) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token payload' }, { status: 401 });
    }
    const userWalletAddress = decoded.address as string;

    if (!isAdmin(userWalletAddress)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    policyId = body.policyId;
    action = body.action;

    if (!policyId || action !== 'revoke') {
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
    }

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
