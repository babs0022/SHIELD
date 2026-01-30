import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest
) {
  try {
    const url = new URL(request.url);
    const policyId = url.pathname.split('/').pop();

    if (!policyId) {
      return NextResponse.json({ error: "Policy ID not provided in URL." }, { status: 400 });
    }

    const policies = await sql`
      SELECT resource_cid, recipient_address, mime_type, is_text 
      FROM policies 
      WHERE LOWER(policy_id) = LOWER(${policyId})
    `;

    if (policies.length > 0) {
      const policy = policies[0];
      const mappedPolicy = {
        resourceCid: policy.resource_cid,
        recipient_address: policy.recipient_address,
        mimeType: policy.mime_type,
        isText: policy.is_text,
      };
      return NextResponse.json(mappedPolicy);
    } else {
      return NextResponse.json({ error: "Policy not found." }, { status: 404 });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json({ error: "Failed to retrieve policy.", details: errorMessage }, { status: 500 });
  }
}
