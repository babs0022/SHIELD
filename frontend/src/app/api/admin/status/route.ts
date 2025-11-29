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

export async function GET(req: NextRequest) {
  console.log('Admin status endpoint hit');
  const token = req.headers.get('authorization')?.split(' ')[1];
  if (!token) {
    console.error('No token provided');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }
    console.log('Verifying JWT...');
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userWalletAddress = payload.address as string;
    console.log(`JWT verified for address: ${userWalletAddress}`);

    if (!isAdmin(userWalletAddress)) {
      console.error(`Address ${userWalletAddress} is not an admin.`);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.log('Admin check passed.');

    // Total Users
    console.log('Fetching total users...');
    const totalUsersResult = await sql`SELECT COUNT(DISTINCT recipient_address) FROM policies`;
    const totalUsers = parseInt(totalUsersResult[0].count, 10);
    console.log(`Total users: ${totalUsers}`);

    // Total Links Created
    console.log('Fetching total links created...');
    const totalLinksCreatedResult = await sql`SELECT COUNT(*) FROM policies`;
    const totalLinksCreated = parseInt(totalLinksCreatedResult[0].count, 10);
    console.log(`Total links created: ${totalLinksCreated}`);

    let totalLinksOpened = 0;
    let activeUsers24h = 0;
    let activeUsers7d = 0;
    let activeUsers30d = 0;

    try {
      console.log('Checking for attempts table...');
      const tableCheck = await sql`SELECT to_regclass('public.attempts')`;
      if (tableCheck[0].to_regclass) {
        console.log('attempts table found. Querying stats...');
        // Total Links Opened
        const openedResult = await sql`SELECT COUNT(*) FROM attempts WHERE success = TRUE`;
        totalLinksOpened = parseInt(openedResult[0].count, 10);
        console.log(`Total links opened: ${totalLinksOpened}`);

        // Active Users
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const active24hResult = await sql`SELECT COUNT(DISTINCT recipient_address) FROM attempts WHERE timestamp >= ${oneDayAgo} AND success = TRUE`;
        activeUsers24h = parseInt(active24hResult[0].count, 10);
        console.log(`Active users (24h): ${activeUsers24h}`);

        const active7dResult = await sql`SELECT COUNT(DISTINCT recipient_address) FROM attempts WHERE timestamp >= ${sevenDaysAgo} AND success = TRUE`;
        activeUsers7d = parseInt(active7dResult[0].count, 10);
        console.log(`Active users (7d): ${activeUsers7d}`);

        const active30dResult = await sql`SELECT COUNT(DISTINCT recipient_address) FROM attempts WHERE timestamp >= ${thirtyDaysAgo} AND success = TRUE`;
        activeUsers30d = parseInt(active30dResult[0].count, 10);
        console.log(`Active users (30d): ${activeUsers30d}`);
      } else {
        console.warn('attempts table does not exist. Skipping related stats.');
      }
    } catch (dbError) {
      console.error('Error querying attempts table:', dbError);
    }
    console.log('Stats queries complete. Sending response.');

    // ... (database queries remain the same)

    // Application Status Checks
    const baseUrl = req.nextUrl.origin;
    const endpointsToTest = [
      '/api/signIn',
      '/api/storeMetadata',
      '/api/getPolicy',
      '/api/verify-siwe',
      '/api/health',
      '/api/user/profile',
      '/api/avatar/upload',
      '/api/user/links',
      '/api/admin/status',
      '/api/admin/links',
      '/api/admin/manage-admins',
      '/api/user/stats',
      '/api/createLink',
      '/api/getEncryptedContent',
      '/api/notifications',
      '/api/prepareContent',
      '/api/siwe',
    ];
    const endpointStatusPromises = endpointsToTest.map(async (endpoint) => {
      const startTime = Date.now();
      try {
        const response = await fetch(`${baseUrl}${endpoint}`, { method: 'HEAD' });
        const duration = Date.now() - startTime;
        return {
          name: endpoint,
          status: response.ok ? 'responsive' : 'error',
          avgResponseTime: `${duration}ms`,
        };
      } catch (error) {
        const duration = Date.now() - startTime;
        return {
          name: endpoint,
          status: 'unresponsive',
          avgResponseTime: `${duration}ms`,
        };
      }
    });

    const endpoints = await Promise.all(endpointStatusPromises);
    const avgResponseTime = (endpoints.reduce((acc, e) => acc + parseInt(e.avgResponseTime), 0) / endpoints.length).toFixed(0);

    const healthResponse = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthResponse.json();

    return NextResponse.json({
      totalUsers,
      totalLinksCreated,
      totalLinksOpened,
      activeUsers: {
        '24h': activeUsers24h,
        '7d': activeUsers7d,
        '30d': activeUsers30d,
      },
      applicationStatus: {
        uptime: healthData.database === 'connected' ? '100%' : 'Partial Outage',
        averageResponseTime: `${avgResponseTime}ms`,
        endpoints,
      },
    });
  } catch (error) {
    console.error('Error fetching admin status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}