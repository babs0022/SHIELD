import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import axios from 'axios';
import FormData from 'form-data';
import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';
import { Pool } from 'pg';
import ShieldABI from '@/lib/Shield.json';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL;
const privateKey = process.env.SERVER_WALLET_PRIVATE_KEY;
const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const pinataJwt = process.env.PINATA_JWT;

if (!privateKey) {
  throw new Error("SERVER_WALLET_PRIVATE_KEY is not set");
}

if (!contractAddress) {
  throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS is not set");
}

const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
const wallet = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(contractAddress, ShieldABI.abi, wallet);

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
    const expiry = data.get('expiry') as string;
    const maxAttempts = data.get('maxAttempts') as string;
    const isText = data.get('isText') as string;
    const creatorId = data.get('creatorId') as string;
    const recipientAddress = data.get('recipientAddress') as string;
    const mimeType = data.get('mimeType') as string;

    if (!content || !recipientAddress) {
      return NextResponse.json({ error: "Missing content or recipient address." }, { status: 400 });
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

    let policyId;
    let policyExists = true;
    while (policyExists) {
      policyId = ethers.utils.hexlify(ethers.utils.randomBytes(32));
      const existingPolicy = await contract.policies(policyId);
      if (existingPolicy.sender === ethers.constants.AddressZero) {
        policyExists = false;
      }
    }
    const expiryTimestamp = Math.floor(Date.now() / 1000) + parseInt(expiry, 10);

    const tx = await contract.createPolicy(policyId, recipientAddress, expiryTimestamp, parseInt(maxAttempts, 10), { gasLimit: 80000 });
    await tx.wait();

    const client = await pool.connect();
    try {
      await client.query(
        `INSERT INTO policies (policy_id, creator_id, resource_cid, recipient_address, secret_key, mime_type, is_text, expiry, max_attempts, attempts, valid)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          policyId,
          creatorId,
          contentCid,
          recipientAddress,
          secretKey,
          mimeType,
          isText === 'true',
          expiryTimestamp,
          parseInt(maxAttempts, 10),
          0,
          true,
        ]
      );
    } finally {
      client.release();
    }

    const link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/r/${policyId}`;
    return NextResponse.json({ success: true, link });

  } catch (error) {
    console.error("Error in /api/createLink:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json({ error: "Failed to create link.", details: errorMessage }, { status: 500 });
  }
}