import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { SUPER_ADMIN_ADDRESSES, TEAM_ADMIN_ADDRESSES } from '@/config/admin';
import { jwtVerify } from 'jose';

const isAdmin = (address: string | null | undefined) => {
  if (!address) return false;
  const lowerCaseAddress = address.toLowerCase();
  return (
    SUPER_ADMIN_ADDRESSES.map(addr => addr.toLowerCase()).includes(lowerCaseAddress) ||
    TEAM_ADMIN_ADDRESSES.map(addr => addr.toLowerCase()).includes(lowerCaseAddress)
  );
};

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!process.env.JWT_SECRET) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userWalletAddress = payload.address as string;

    if (!isAdmin(userWalletAddress)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const tier = searchParams.get('tier');
    const search = searchParams.get('search');

    const offset = (page - 1) * limit;

    let usersQuery;
    let countQuery;

    try {
      if (tier && search) {
        usersQuery = await sql`
          SELECT u.wallet_address, u.display_name, u.tier, COUNT(p.policy_id) AS total_links
          FROM users u LEFT JOIN policies p ON u.wallet_address = p.creator_id
          WHERE u.tier = ${tier} AND (u.wallet_address ILIKE ${'%' + search + '%'} OR u.display_name ILIKE ${'%' + search + '%'})
          GROUP BY u.wallet_address, u.display_name, u.tier
          ORDER BY u.last_login_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
        countQuery = await sql`SELECT COUNT(*) FROM users WHERE tier = ${tier} AND (wallet_address ILIKE ${'%' + search + '%'} OR display_name ILIKE ${'%' + search + '%'})`;
      } else if (tier) {
        usersQuery = await sql`
          SELECT u.wallet_address, u.display_name, u.tier, COUNT(p.policy_id) AS total_links
          FROM users u LEFT JOIN policies p ON u.wallet_address = p.creator_id
          WHERE u.tier = ${tier}
          GROUP BY u.wallet_address, u.display_name, u.tier
          ORDER BY u.last_login_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
        countQuery = await sql`SELECT COUNT(*) FROM users WHERE tier = ${tier}`;
      } else if (search) {
        usersQuery = await sql`
          SELECT u.wallet_address, u.display_name, u.tier, COUNT(p.policy_id) AS total_links
          FROM users u LEFT JOIN policies p ON u.wallet_address = p.creator_id
          WHERE u.wallet_address ILIKE ${'%' + search + '%'} OR u.display_name ILIKE ${'%' + search + '%'}
          GROUP BY u.wallet_address, u.display_name, u.tier
          ORDER BY u.last_login_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
        countQuery = await sql`SELECT COUNT(*) FROM users WHERE wallet_address ILIKE ${'%' + search + '%'} OR display_name ILIKE ${'%' + search + '%'}`;
      } else {
        usersQuery = await sql`
          SELECT u.wallet_address, u.display_name, u.tier, COUNT(p.policy_id) AS total_links
          FROM users u LEFT JOIN policies p ON u.wallet_address = p.creator_id
          GROUP BY u.wallet_address, u.display_name, u.tier
          ORDER BY u.last_login_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
        countQuery = await sql`SELECT COUNT(*) FROM users`;
      }

      const totalUsers = parseInt(countQuery[0].count, 10);
      const totalPages = Math.ceil(totalUsers / limit);
      
      return NextResponse.json({
        users: usersQuery,
        totalPages,
        currentPage: page,
      });

    } catch (dbError) {
      const errorMessage = dbError instanceof Error ? dbError.message : 'A database error occurred.';
      return NextResponse.json({ error: 'Failed to execute database query.', details: errorMessage }, { status: 500 });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: 'Failed to fetch users.', details: errorMessage }, { status: 500 });
  }
}
