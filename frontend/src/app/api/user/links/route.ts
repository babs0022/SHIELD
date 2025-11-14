import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { getAuth } from '@clerk/nextjs/server';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function GET(request: NextRequest) {
  const { userId: walletAddress } = getAuth(request);

  if (!walletAddress) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT policy_id, created_at, expiry, max_attempts FROM policies WHERE creator_id = $1 ORDER BY created_at DESC',
      [walletAddress]
    );
    
    const links = result.rows.map(row => ({
      id: row.policy_id,
      createdAt: row.created_at,
      expiry: row.expiry,
      maxAttempts: row.max_attempts,
      url: `${process.env.NEXT_PUBLIC_URL}/r/${row.policy_id}`,
    }));

    return NextResponse.json({ links });
  } catch (error) {
    console.error('Error fetching user links:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  } finally {
    client.release();
  }
}
