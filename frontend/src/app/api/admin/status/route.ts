import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { SUPER_ADMIN_ADDRESSES, TEAM_ADMIN_ADDRESSES } from '@/config/admin';
import { getAuth } from '@clerk/nextjs/server';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

// Helper to check if an address is an admin
const isAdmin = (address: string | null | undefined) => {
  if (!address) return false;
  const lowerCaseAddress = address.toLowerCase();
  return (
    SUPER_ADMIN_ADDRESSES.map(addr => addr.toLowerCase()).includes(lowerCaseAddress) ||
    TEAM_ADMIN_ADDRESSES.map(addr => addr.toLowerCase()).includes(lowerCaseAddress)
  );
};

export async function GET(req: NextRequest) {
  const { userId, sessionClaims } = getAuth(req);

  if (!userId || !sessionClaims?.public_metadata?.wallet_address) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userWalletAddress = sessionClaims.public_metadata.wallet_address as string;

  if (!isAdmin(userWalletAddress)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const client = await pool.connect();
    
    // Total Users (unique recipient addresses)
    const totalUsersResult = await client.query('SELECT COUNT(DISTINCT recipient_address) FROM policies');
    const totalUsers = parseInt(totalUsersResult.rows[0].count, 10);

    // Total Links Created
    const totalLinksCreatedResult = await client.query('SELECT COUNT(*) FROM policies');
    const totalLinksCreated = parseInt(totalLinksCreatedResult.rows[0].count, 10);

    // Total Links Opened (assuming a log_attempts table or similar)
    // This requires a 'log_attempts' table with 'policy_id' and 'success' columns
    const totalLinksOpenedResult = await client.query('SELECT COUNT(*) FROM log_attempts WHERE success = TRUE');
    const totalLinksOpened = parseInt(totalLinksOpenedResult.rows[0].count, 10);

    // Active Users (last 24 hours, 7 days, 30 days)
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const activeUsers24hResult = await client.query(
      'SELECT COUNT(DISTINCT recipient_address) FROM log_attempts WHERE timestamp >= $1 AND success = TRUE',
      [oneDayAgo]
    );
    const activeUsers24h = parseInt(activeUsers24hResult.rows[0].count, 10);

    const activeUsers7dResult = await client.query(
      'SELECT COUNT(DISTINCT recipient_address) FROM log_attempts WHERE timestamp >= $1 AND success = TRUE',
      [sevenDaysAgo]
    );
    const activeUsers7d = parseInt(activeUsers7dResult.rows[0].count, 10);

    const activeUsers30dResult = await client.query(
      'SELECT COUNT(DISTINCT recipient_address) FROM log_attempts WHERE timestamp >= $1 AND success = TRUE',
      [thirtyDaysAgo]
    );
    const activeUsers30d = parseInt(activeUsers30dResult.rows[0].count, 10);

    client.release();

    return NextResponse.json({
      totalUsers,
      totalLinksCreated,
      totalLinksOpened,
      activeUsers: {
        '24h': activeUsers24h,
        '7d': activeUsers7d,
        '30d': activeUsers30d,
      },
      // Placeholder for application status (uptime, response times)
      applicationStatus: {
        uptime: '99.9%', // This would come from a monitoring service
        averageResponseTime: '150ms', // This would come from middleware/logs
        endpoints: [
          { name: '/api/getPolicy', status: 'responsive', avgResponseTime: '100ms' },
          { name: '/api/verify-siwe', status: 'responsive', avgResponseTime: '200ms' },
        ],
      },
    });
  } catch (error) {
    console.error('Error fetching admin status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
