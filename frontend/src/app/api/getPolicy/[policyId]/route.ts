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
      const policy = result.rows[0];
      const mappedPolicy = {
        resourceCid: policy.resource_cid,
        recipient_address: policy.recipient_address,
        secretKey: policy.secret_key,
        mimeType: policy.mime_type,
        isText: policy.is_text,
      };
      return NextResponse.json(mappedPolicy);
    } else {
      return NextResponse.json({ error: "Policy not found." }, { status: 404 });
    }
  } catch (error) {
    console.error("Error in /api/getPolicy:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json({ error: "Failed to retrieve policy.", details: errorMessage }, { status: 500 });
  } finally {
    client.release();
  }
}