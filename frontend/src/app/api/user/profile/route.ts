import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Address is required.' }, { status: 400 });
  }

  if (!process.env.NEYNAR_API_KEY) {
    console.error('NEYNAR_API_KEY is not set.');
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      api_key: process.env.NEYNAR_API_KEY,
    },
  };

  try {
    const response = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${address}`, options);
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Neynar API error:', errorData);
      return NextResponse.json({ error: 'Failed to fetch user from Neynar.' }, { status: response.status });
    }

    const data = await response.json();
    
    // Neynar API returns an object where keys are addresses, and values are arrays of users
    const usersForAddress = data[address.toLowerCase()];

    if (!usersForAddress || usersForAddress.length === 0) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const user = usersForAddress[0];

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({
      displayName: user.display_name,
      pfpUrl: user.pfp_url,
    });
  } catch (error) {
    console.error('Error fetching from Neynar:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
