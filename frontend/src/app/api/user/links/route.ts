import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import sql from '@/lib/db';

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const walletAddress = payload.address as string;

    const results = await sql`
      SELECT policy_id, created_at, expiry, max_attempts 
      FROM policies 
      WHERE creator_id = ${walletAddress} 
      ORDER BY created_at DESC
    `;
    
    const baseUrl = process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL
      : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
    
    const links = results.map(row => ({
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
  }
}
