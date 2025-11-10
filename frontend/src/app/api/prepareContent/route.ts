import { NextResponse } from 'next/server';
import axios from 'axios';
import FormData from 'form-data';
import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';

const pinataJwt = process.env.PINATA_JWT;

const pinToIPFS = async (data: Buffer, filename: string) => {
  const formData = new FormData();
  formData.append('file', data, filename);
  const response = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
    headers: {
      'Authorization': `Bearer ${pinataJwt}`,
    },
  });
  return response.data.IpfsHash;
};

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const content = data.get('content');
    const isText = data.get('isText') as string;
    const mimeType = data.get('mimeType') as string;

    if (!content) {
      return NextResponse.json({ error: "Missing content." }, { status: 400 });
    }

    const secretKey = CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex);

    let buffer: Buffer;
    if (isText === 'true') {
      buffer = Buffer.from(content as string, 'utf8');
    } else {
      const file = content as File;
      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
    }

    const encryptedContent = CryptoJS.AES.encrypt(buffer.toString('base64'), secretKey).toString();
    const contentCid = await pinToIPFS(Buffer.from(encryptedContent), `content-${uuidv4()}`);

    return NextResponse.json({ success: true, contentCid, secretKey, mimeType });

  } catch (error) {
    console.error("Error in /api/prepareContent:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json({ error: "Failed to prepare content.", details: errorMessage }, { status: 500 });
  }
}
