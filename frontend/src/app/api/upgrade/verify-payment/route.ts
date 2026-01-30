import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, Hex, parseAbiItem } from 'viem';
import { base } from 'viem/chains';
import sql from '@/lib/db';
import { jwtVerify } from 'jose';

const USDC_CONTRACT_ADDRESS = process.env.USDC_CONTRACT_ADDRESS as Hex | undefined;
const UPGRADE_WALLET_ADDRESS = process.env.UPGRADE_WALLET_ADDRESS as Hex | undefined;
const JWT_SECRET = process.env.JWT_SECRET;
const BASE_RPC_URL = process.env.BASE_RPC_URL || "https://mainnet.base.org";

if (!USDC_CONTRACT_ADDRESS) {
  throw new Error("USDC_CONTRACT_ADDRESS is not set in server environment");
}
if (!UPGRADE_WALLET_ADDRESS) {
  throw new Error("UPGRADE_WALLET_ADDRESS is not set in server environment");
}
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not set in server environment");
}

export async function POST(request: NextRequest) {
  try {
    const { txHash, subscriptionType } = await request.json();

    if (!txHash || !subscriptionType) {
      return NextResponse.json({ error: 'Missing transaction hash or subscription type.' }, { status: 400 });
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const secret = new TextEncoder().encode(JWT_SECRET);
    let payload;
    try {
        const { payload: jwtPayload } = await jwtVerify(token, secret);
        payload = jwtPayload;
    } catch (jwtError) {
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    const userAddress = payload.address as string;

    const publicClient = createPublicClient({
      chain: base,
      transport: http(BASE_RPC_URL),
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    if (receipt.status !== 'success') {
        return NextResponse.json({ error: 'Transaction failed on-chain.' }, { status: 400 });
    }

    // Decode the logs to find the Transfer event
    const transferEvent = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');
    const transferLog = receipt.logs.find(logItem => {
        try {
            return logItem.address.toLowerCase() === USDC_CONTRACT_ADDRESS.toLowerCase() &&
                   logItem.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'; // keccak256 hash of Transfer(address,address,uint256)
        } catch (e) {
            return false;
        }
    });

    if (!transferLog) {
        return NextResponse.json({ error: 'USDC Transfer event not found in transaction.' }, { status: 400 });
    }
    
    const fromAddress = transferLog.topics[1] ? `0x${transferLog.topics[1].slice(26)}` : '';
    const toAddress = transferLog.topics[2] ? `0x${transferLog.topics[2].slice(26)}` : '';
    const value = BigInt(transferLog.data);

    if (fromAddress.toLowerCase() !== userAddress.toLowerCase()) {
        return NextResponse.json({ error: 'Transaction sender does not match authenticated user.' }, { status: 400 });
    }

    if (toAddress.toLowerCase() !== UPGRADE_WALLET_ADDRESS.toLowerCase()) {
        return NextResponse.json({ error: 'Transaction recipient is incorrect.' }, { status: 400 });
    }
    
    // The test amount we are expecting (0.0005 USDC for now)
    const expectedAmount = BigInt(500); 

    if (value !== expectedAmount) {
        return NextResponse.json({ error: `Incorrect payment amount. Expected ${expectedAmount}, got ${value}.` }, { status: 400 });
    }
    
    // All checks pass, update the user's tier
    const expiryDate = new Date();
    const durationDays = subscriptionType === 'yearly' ? 365 : 30;
    expiryDate.setDate(expiryDate.getDate() + durationDays);

    await sql`
      UPDATE users
      SET tier = 'pro', subscription_expires_at = ${expiryDate.toISOString()}
      WHERE wallet_address = ${userAddress}
    `;

    return NextResponse.json({ success: true, message: 'Successfully verified payment and upgraded to Pro tier!' });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: 'Failed to verify payment.', details: errorMessage }, { status: 500 });
  }
}
