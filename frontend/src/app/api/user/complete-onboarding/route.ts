import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import sql from '@/lib/db';

// ... (runtime export remains the same)

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

export async function POST(request: NextRequest) {
    const address = await getAddressFromToken(request);
    if (!address) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  try {
    await sql`
      UPDATE users 
      SET onboarding_completed = TRUE 
      WHERE wallet_address = ${address}
    `;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating onboarding status:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
