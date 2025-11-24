import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  const { walletAddress } = await request.json();

  try {
    const client = await pool.connect();
    try {
      const now = new Date();
      const result = await client.query(
        `INSERT INTO users (wallet_address, first_login_at, last_login_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (wallet_address)
         DO UPDATE SET last_login_at = $3
         RETURNING *;`,
        [walletAddress, now, now]
      );

      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined in environment variables.');
      }
      const token = jwt.sign({ address: walletAddress }, process.env.JWT_SECRET, {
        expiresIn: '1d',
      });

      return NextResponse.json({ success: true, user: result.rows[0], token });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
