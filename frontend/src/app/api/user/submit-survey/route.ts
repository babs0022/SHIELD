// src/app/api/user/submit-survey/route.ts
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

export async function POST(request: NextRequest) {
    const address = await getAddressFromToken(request);
    if (!address) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { primaryUse, howHeard } = await request.json();

    if (!primaryUse || !howHeard) {
        return NextResponse.json({ error: 'Missing survey data.' }, { status: 400 });
    }

    try {
        await sql`
            INSERT INTO onboarding_surveys (user_address, primary_use, how_heard)
            VALUES (${address}, ${primaryUse}, ${howHeard})
        `;
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving survey response:', error);
        return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
}
