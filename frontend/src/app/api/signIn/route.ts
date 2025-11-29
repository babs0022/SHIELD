import { NextRequest, NextResponse } from 'next/server';
import { SiweMessage } from 'siwe';
import { SignJWT } from 'jose';
import sql from '@/lib/db';

const createUserTable = async () => {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        wallet_address VARCHAR(42) PRIMARY KEY,
        first_login_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        last_login_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        display_name TEXT,
        pfp_url TEXT,
        onboarding_completed BOOLEAN DEFAULT FALSE
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS onboarding_surveys (
        id SERIAL PRIMARY KEY,
        user_address VARCHAR(42) REFERENCES users(wallet_address),
        primary_use VARCHAR(255),
        how_heard VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `;
  } catch (error) {
    console.error('Error creating user tables:', error);
  }
};

// Create a top-level await to ensure the database is ready before the module is used.
await createUserTable();

export async function POST(request: NextRequest) {
  const { message, signature } = await request.json();
  const siweMessage = new SiweMessage(message);

  try {
    await siweMessage.verify({ signature });

    const walletAddress = siweMessage.address;
    const now = new Date();
    
    const users = await sql`
      INSERT INTO users (wallet_address, first_login_at, last_login_at)
      VALUES (${walletAddress}, ${now}, ${now})
      ON CONFLICT (wallet_address)
      DO UPDATE SET last_login_at = ${now}
      RETURNING *, (first_login_at = last_login_at) as is_new_user;
    `;
    const user = users[0];
    const showOnboarding = !user.onboarding_completed;

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment variables.');
    }
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const token = await new SignJWT({ address: walletAddress })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1d')
      .sign(secret);

    return NextResponse.json({ success: true, user, token, showOnboarding });
  } catch (error) {
    console.error('Error in signIn API:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}