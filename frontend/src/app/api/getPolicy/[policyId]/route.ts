import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function GET(
  request: NextRequest,
) {
  const url = new URL(request.url);
  const policyId = url.pathname.split('/').pop(); // Extract policyId from the URL pathname

  if (!policyId) {
    return NextResponse.json({ error: "Policy ID not provided." }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM policies WHERE policy_id = $1', [policyId]);
    if (result.rows.length > 0) {
      return NextResponse.json(result.rows[0]);
    } else {
      return NextResponse.json({ error: "Policy not found." }, { status: 404 });
    }
  } finally {
    client.release();
  }
}