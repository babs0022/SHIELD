import { NextResponse } from 'next/server';
import { SiweMessage } from 'siwe';
import { Pool } from 'pg';
import { ethers } from 'ethers';
import ShieldABI from '@/lib/Shield.json';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const rpcUrl = process.env.RPC_URL;
const privateKey = process.env.SERVER_WALLET_PRIVATE_KEY;
const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

if (!privateKey) {
  throw new Error("SERVER_WALLET_PRIVATE_KEY is not set");
}

if (!contractAddress) {
  throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS is not set");
}

const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
const wallet = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(contractAddress, ShieldABI.abi, wallet);

export async function POST(request: Request) {
  const { message, signature, policyId } = await request.json();
  if (!message || !signature || !policyId) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const siweMessage = new SiweMessage(message);
    const { data: fields } = await siweMessage.verify({ signature });

    const client = await pool.connect();
    let policy;
    try {
      const result = await client.query('SELECT * FROM policies WHERE policy_id = $1', [policyId]);
      if (result.rows.length > 0) {
        policy = result.rows[0];
      } else {
        return NextResponse.json({ error: "Policy not found." }, { status: 404 });
      }
    } finally {
      client.release();
    }

    if (fields.address !== policy.recipient_address) {
      return NextResponse.json({ error: "Signer address does not match recipient address." }, { status: 401 });
    }

    const tx = await contract.logAttempt(policyId, true);
    await tx.wait();

    return NextResponse.json({ success: true, secretKey: policy.secret_key });

  } catch (error) {
    console.error("Error in /api/verify-siwe:", error);
    return NextResponse.json({ error: "Failed to verify signature.", details: (error as Error).message }, { status: 500 });
  }
}