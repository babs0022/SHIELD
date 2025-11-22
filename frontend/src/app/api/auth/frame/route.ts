import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  const { trustedData } = await request.json();

  if (!trustedData || !trustedData.messageBytes) {
    return NextResponse.json({ error: 'Invalid Farcaster message.' }, { status: 400 });
  }

  if (!process.env.NEYNAR_API_KEY) {
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }
  if (!process.env.JWT_SECRET) {
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  // Validate the message with Neynar
  const validationResponse = await fetch('https://api.neynar.com/v2/farcaster/frame/validate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api_key': process.env.NEYNAR_API_KEY,
    },
    body: JSON.stringify({ message_bytes_in_hex: `0x${trustedData.messageBytes}` }),
  });

  if (!validationResponse.ok) {
    return NextResponse.json({ error: 'Failed to validate Farcaster message.' }, { status: 401 });
  }

  const validationData = await validationResponse.json();
  const { verified_addresses } = validationData.action.interactor;

  if (!verified_addresses || verified_addresses.length === 0) {
    return NextResponse.json({ error: 'No verified address found for this user.' }, { status: 401 });
  }

  const walletAddress = verified_addresses[0];

  // Generate a JWT for the user
  const token = jwt.sign({ address: walletAddress }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });

  // Upsert user into the database (same logic as signIn route)
  const client = await pool.connect();
  try {
    const now = new Date();
    await client.query(
      `INSERT INTO users (wallet_address, first_login_at, last_login_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (wallet_address)
       DO UPDATE SET last_login_at = $3;`,
      [walletAddress, now, now]
    );
  } finally {
    client.release();
  }

  // Redirect to the main app with the token
  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
  const redirectUrl = `${baseUrl}/?token=${token}`;
  return NextResponse.redirect(redirectUrl, { status: 302 });
}
