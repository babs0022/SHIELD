import { NextRequest, NextResponse } from 'next/server';
import { SUPER_ADMIN_ADDRESSES, TEAM_ADMIN_ADDRESSES } from '@/config/admin';

// Helper to check if an address is a Super Admin
const isSuperAdmin = (address: string | null | undefined) => {
  if (!address) return false;
  const lowerCaseAddress = address.toLowerCase();
  return SUPER_ADMIN_ADDRESSES.map(addr => addr.toLowerCase()).includes(lowerCaseAddress);
};

// Function to get admins from environment variables
const getAdminsFromEnv = () => {
  const superAdmins = (process.env.SUPER_ADMIN_ADDRESSES || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
  const teamAdmins = (process.env.TEAM_ADMIN_ADDRESSES || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
  return { superAdmins, teamAdmins };
};
import { jwtVerify } from 'jose';



export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!process.env.JWT_SECRET) {
      console.error('API Error: JWT_SECRET is not defined.');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    // Log a portion of the secret to confirm it's loaded, without exposing it.
    console.log(`JWT_SECRET is present. Starts with: ${process.env.JWT_SECRET.substring(0, 3)}, Ends with: ${process.env.JWT_SECRET.slice(-3)}`);
    
    console.log('Verifying JWT...');
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userWalletAddress = payload.address as string;
    console.log(`JWT verified for address: ${userWalletAddress}`);

    if (!isSuperAdmin(userWalletAddress)) {
      console.error(`Forbidden: Address ${userWalletAddress} is not a super admin.`);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { superAdmins, teamAdmins } = getAdminsFromEnv();
    return NextResponse.json({ superAdmins, teamAdmins });
  } catch (error: any) {
    console.error('An error occurred in manage-admins API:', error.name, error.message);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!process.env.JWT_SECRET) {
      console.error('API Error: JWT_SECRET is not defined.');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    // Log a portion of the secret to confirm it's loaded, without exposing it.
    console.log(`JWT_SECRET is present. Starts with: ${process.env.JWT_SECRET.substring(0, 3)}, Ends with: ${process.env.JWT_SECRET.slice(-3)}`);
    
    console.log('Verifying JWT...');
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userWalletAddress = payload.address as string;
    console.log(`JWT verified for address: ${userWalletAddress}`);

    if (!isSuperAdmin(userWalletAddress)) {
      console.error(`Forbidden: Address ${userWalletAddress} is not a super admin.`);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // In a serverless environment, we can't write to the filesystem.
    // Admin list must be managed via environment variables in the Vercel dashboard.
    return NextResponse.json({ 
      error: 'This feature is disabled in production. Please manage admins in your Vercel project environment variables.' 
    }, { status: 400 });
  } catch (error: any) {
    console.error('An error occurred in manage-admins API:', error.name, error.message);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!process.env.JWT_SECRET) {
      console.error('API Error: JWT_SECRET is not defined.');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    // Log a portion of the secret to confirm it's loaded, without exposing it.
    console.log(`JWT_SECRET is present. Starts with: ${process.env.JWT_SECRET.substring(0, 3)}, Ends with: ${process.env.JWT_SECRET.slice(-3)}`);
    
    console.log('Verifying JWT...');
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userWalletAddress = payload.address as string;
    console.log(`JWT verified for address: ${userWalletAddress}`);

    if (!isSuperAdmin(userWalletAddress)) {
      console.error(`Forbidden: Address ${userWalletAddress} is not a super admin.`);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // In a serverless environment, we can't write to the filesystem.
    // Admin list must be managed via environment variables in the Vercel dashboard.
    return NextResponse.json({ 
      error: 'This feature is disabled in production. Please manage admins in your Vercel project environment variables.' 
    }, { status: 400 });
  } catch (error: any) {
    console.error('An error occurred in manage-admins API:', error.name, error.message);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
