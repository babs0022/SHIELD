// src/app/api/health/route.ts
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Check database connection
    await sql`SELECT 1`;
    return NextResponse.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({ status: 'error', database: 'disconnected' }, { status: 500 });
  }
}
