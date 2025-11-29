import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import sql from '@/lib/db';

async function getAddressFromToken(request: NextRequest): Promise<string | null> {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token || !process.env.JWT_SECRET) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload.address as string | null;
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const address = await getAddressFromToken(request);
  if (!address) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const columnCheck = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'display_name'
    `;

    let profile;
    if (columnCheck.length > 0) {
      const results = await sql`
        SELECT display_name as "displayName", pfp_url as "pfpUrl" 
        FROM users 
        WHERE wallet_address = ${address}
      `;
      if (results.length > 0) {
        profile = results[0];
      }
    }

    if (!profile) {
      return NextResponse.json({ displayName: address, pfpUrl: '' });
    }

    return NextResponse.json(profile);

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // ... (token logic remains the same)
  const address = await getAddressFromToken(request);
  if (!address) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { displayName, pfpUrl } = await request.json();
  console.log(`Updating profile for ${address}:`, { displayName, pfpUrl });

  try {
    await sql`
      UPDATE users 
      SET display_name = ${displayName}, pfp_url = ${pfpUrl} 
      WHERE wallet_address = ${address}
    `;
    console.log(`Profile updated successfully for ${address}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
