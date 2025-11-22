import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

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
      
      const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
      const links = result.rows.map(row => ({
        id: row.policy_id,
        createdAt: row.created_at,
        expiry: row.expiry,
        maxAttempts: row.max_attempts,
        url: `${baseUrl}/r/${row.policy_id}`,
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
