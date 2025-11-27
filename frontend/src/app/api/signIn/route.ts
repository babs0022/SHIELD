import { NextRequest, NextResponse } from 'next/server';
import { SiweMessage } from 'siwe';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

const createUserTable = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        wallet_address VARCHAR(42) PRIMARY KEY,
        first_login_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        last_login_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    // Add columns if they don't exist
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS pfp_url TEXT;');
  } finally {
    client.release();
  }
};

createUserTable().catch(console.error);

export async function POST(request: NextRequest) {
  const { message, signature } = await request.json();
  const siweMessage = new SiweMessage(message);

  try {
    const { success } = await siweMessage.verify({
      signature,
      domain: process.env.NEXT_PUBLIC_URL,
    });

    if (!success) {
      return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 });
    }

    const walletAddress = siweMessage.address;
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
    } catch (error) {
      console.error('Error in signIn API:', error);
      return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error verifying SIWE message:', error);
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 });
  }
}
