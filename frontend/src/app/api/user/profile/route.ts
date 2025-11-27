import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

async function getAddressFromToken(request: NextRequest): Promise<string | null> {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) {
    return null;
  }
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (typeof decoded === 'string' || !decoded.address) {
      return null;
    }
    return decoded.address;
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const address = await getAddressFromToken(request);
  if (!address) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = await pool.connect();
  try {
    // Check if the new columns exist to prevent crashing on old schemas
    const columnCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'display_name'
    `);

    let profile;
    if (columnCheck.rows.length > 0) {
      // Columns exist, fetch the full profile
      const result = await client.query('SELECT display_name as "displayName", pfp_url as "pfpUrl" FROM users WHERE wallet_address = $1', [address]);
      if (result.rows.length > 0) {
        profile = result.rows[0];
      }
    }

    // If profile wasn't found or columns don't exist, return a default profile
    if (!profile) {
      return NextResponse.json({ displayName: address, pfpUrl: '' });
    }

    return NextResponse.json(profile);

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function POST(request: NextRequest) {
  const address = await getAddressFromToken(request);
  if (!address) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { displayName, pfpUrl } = await request.json();

  const client = await pool.connect();
  try {
    await client.query(
      'UPDATE users SET display_name = $1, pfp_url = $2 WHERE wallet_address = $3',
      [displayName, pfpUrl, address]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  } finally {
    client.release();
  }
}
