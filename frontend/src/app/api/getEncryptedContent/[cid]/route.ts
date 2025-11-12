import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { cid: string } }
) {
  const cid = params.cid;

  if (!cid) {
    return NextResponse.json({ error: 'CID is required' }, { status: 400 });
  }

  try {
    const resourceUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;
    const response = await fetch(resourceUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
    }

    const encryptedData = await response.text();
    return NextResponse.json({ encryptedData });
    
  } catch (error) {
    console.error('Error fetching from IPFS:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to fetch content from IPFS.', details: errorMessage }, { status: 500 });
  }
}
