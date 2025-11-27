// src/app/api/user/stats/route.ts
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
    const createdLinksResult = await client.query(
      'SELECT COUNT(*) FROM policies WHERE creator_id = $1',
      [address],
    );
    const totalLinksCreated = parseInt(createdLinksResult.rows[0].count, 10);

    let builderScore = 0; // Default score
    const talentApiKey = process.env.TALENT_PROTOCOL_API_KEY;

    if (talentApiKey) {
      console.log('Talent Protocol API Key found. Attempting to fetch score...');
      try {
        const response = await fetch(`https://api.talentprotocol.com/score?id=${address}`, {
          headers: {
            'Accept': 'application/json',
            'X-API-KEY': talentApiKey,
          },
        });

        console.log(`Talent Protocol API response status: ${response.status}`);

        if (response.ok) {
          const data = await response.json();
          console.log('Talent Protocol API response data:', data);
          // The 'points' value is nested inside the 'score' object
          builderScore = data.score?.points || 0;
        } else {
          const errorBody = await response.text();
          console.error(`Talent Protocol API returned a non-OK response: ${response.status}`, errorBody);
        }
      } catch (error) {
        console.error('Error fetching Builder Score from Talent Protocol:', error);
      }
    } else {
      console.warn('TALENT_PROTOCOL_API_KEY is not set. Skipping Builder Score fetch.');
    }

    return NextResponse.json({
      totalLinksCreated,
      builderScore,
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  } finally {
    client.release();
  }
}
