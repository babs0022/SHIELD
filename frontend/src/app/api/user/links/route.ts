import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (typeof decoded === 'string' || !decoded.address) {
      return NextResponse.json({ error: 'Authentication required: Invalid token payload' }, { status: 401 });
    }
    const walletAddress = decoded.address;

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
  } catch (error) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }
}
