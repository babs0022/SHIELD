import { NextRequest, NextResponse } from 'next/server';
import { SUPER_ADMIN_ADDRESSES, TEAM_ADMIN_ADDRESSES } from '@/config/admin';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

const ADMIN_CONFIG_PATH = path.resolve(process.cwd(), 'src/config/admin.ts');

// Helper to check if an address is a Super Admin
const isSuperAdmin = (address: string | null | undefined) => {
  if (!address) return false;
  const lowerCaseAddress = address.toLowerCase();
  return SUPER_ADMIN_ADDRESSES.map(addr => addr.toLowerCase()).includes(lowerCaseAddress);
};

// Function to read and parse the admin config file
const readAdminConfig = () => {
  const content = fs.readFileSync(ADMIN_CONFIG_PATH, 'utf-8');
  const superAdminMatch = content.match(/export const SUPER_ADMIN_ADDRESSES = [\s\S]*?\];/);
  const teamAdminMatch = content.match(/export const TEAM_ADMIN_ADDRESSES: string\[\] = [\s\S]*?\];/);

  const superAdmins = superAdminMatch && superAdminMatch[1]
    ? superAdminMatch[1].split(',').map(s => s.trim().replace(/'/g, '')).filter(Boolean)
    : [];
  const teamAdmins = teamAdminMatch && teamAdminMatch[1]
    ? teamAdminMatch[1].split(',').map(s => s.trim().replace(/'/g, '')).filter(Boolean)
    : [];

  return { superAdmins, teamAdmins };
};

// Function to write the updated admin config file
const writeAdminConfig = (superAdmins: string[], teamAdmins: string[]) => {
  const superAdminString = superAdmins.map(addr => `"${addr}"`).join(',\n  ');
  const teamAdminString = teamAdmins.map(addr => `"${addr}"`).join(',\n  ');

  const newContent = `export const SUPER_ADMIN_ADDRESSES = [
  ${superAdminString}
];

export const TEAM_ADMIN_ADDRESSES: string[] = [
  ${teamAdminString}
];
`;
  fs.writeFileSync(ADMIN_CONFIG_PATH, newContent, 'utf-8');
};

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (typeof decoded === 'string' || !decoded.address) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token payload' }, { status: 401 });
    }
    const userWalletAddress = decoded.address as string;

    if (!isSuperAdmin(userWalletAddress)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { superAdmins, teamAdmins } = readAdminConfig();
    return NextResponse.json({ superAdmins, teamAdmins });
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (typeof decoded === 'string' || !decoded.address) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token payload' }, { status: 401 });
    }
    const userWalletAddress = decoded.address as string;

    if (!isSuperAdmin(userWalletAddress)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { address, role } = await req.json();

    if (!address || !role || !['SUPER_ADMIN', 'TEAM_ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
    }

    const newAdminAddress = address.toLowerCase();
    let { superAdmins, teamAdmins } = readAdminConfig();

    // Remove from existing list if present
    superAdmins = superAdmins.filter(addr => addr.toLowerCase() !== newAdminAddress);
    teamAdmins = teamAdmins.filter(addr => addr.toLowerCase() !== newAdminAddress);

    if (role === 'SUPER_ADMIN') {
      superAdmins.push(newAdminAddress);
    } else {
      teamAdmins.push(newAdminAddress);
    }

    writeAdminConfig(superAdmins, teamAdmins);

    return NextResponse.json({ message: 'Admin added successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function DELETE(req: NextRequest) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (typeof decoded === 'string' || !decoded.address) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token payload' }, { status: 401 });
    }
    const userWalletAddress = decoded.address as string;

    if (!isSuperAdmin(userWalletAddress)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { address } = await req.json();

    if (!address) {
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
    }

    const addressToRemove = address.toLowerCase();
    let { superAdmins, teamAdmins } = readAdminConfig();

    superAdmins = superAdmins.filter(addr => addr.toLowerCase() !== addressToRemove);
    teamAdmins = teamAdmins.filter(addr => addr.toLowerCase() !== addressToRemove);

    writeAdminConfig(superAdmins, teamAdmins);

    return NextResponse.json({ message: 'Admin removed successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
