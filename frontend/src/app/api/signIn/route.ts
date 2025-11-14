import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { clerkClient } from '@clerk/nextjs/server';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Function to create the users table if it doesn't exist
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
  } finally {
    client.release();
  }
};

// Ensure the table is created when the server starts
createUserTable().catch(console.error);

export async function POST(request: NextRequest) {
  const { walletAddress, userId } = await request.json();

  if (!userId) {
    return NextResponse.json({ error: 'User not authenticated.' }, { status: 401 });
  }

  if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    return NextResponse.json({ error: 'Valid wallet address is required.' }, { status: 400 });
  }

  // Update Clerk user metadata
  try {
    await clerkClient.users.updateUser(userId, {
      publicMetadata: { wallet_address: walletAddress },
    });
  } catch (error) {
    console.error('Error updating Clerk user metadata:', error);
    return NextResponse.json({ error: 'Failed to update user metadata.' }, { status: 500 });
  }

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

    return NextResponse.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Error in signIn API:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  } finally {
    client.release();
  }
}
