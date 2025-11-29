import { NextResponse } from 'next/server';
import { SiweMessage } from 'siwe';
import sql from '@/lib/db';
import { createPublicClient, createWalletClient, http, Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { ShieldABI } from '@/lib/ShieldABI';

const rpcUrl = process.env.BASE_MAINNET_RPC_URL;
const privateKey = process.env.SERVER_WALLET_PRIVATE_KEY as Hex | undefined;
const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as Hex | undefined;

if (!privateKey) {
  throw new Error("SERVER_WALLET_PRIVATE_KEY is not set");
}

if (!contractAddress) {
  throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS is not set");
}

const account = privateKeyToAccount(privateKey);

const publicClient = createPublicClient({
  chain: base,
  transport: http(rpcUrl),
});

const walletClient = createWalletClient({
  account,
  chain: base,
  transport: http(rpcUrl),
});

export async function POST(request: Request) {
  const { message, signature, policyId } = await request.json();
  if (!message || !signature || !policyId) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const siweMessage = new SiweMessage(message);
    const { data: fields } = await siweMessage.verify({ signature });

    const policies = await sql`SELECT * FROM policies WHERE policy_id = ${policyId}`;

    if (policies.length === 0) {
      return NextResponse.json({ error: "Policy not found." }, { status: 404 });
    }
    const policy = policies[0];

    if (fields.address.toLowerCase() !== policy.recipient_address.toLowerCase()) {
      return NextResponse.json({ error: "Signer address does not match recipient address." }, { status: 401 });
    }

    if (!contractAddress) {
      throw new Error("Contract address is not configured.");
    }

    const isStillValid = await publicClient.readContract({
      address: contractAddress,
      abi: ShieldABI,
      functionName: 'isPolicyValid',
      args: [policyId],
    });

    if (!isStillValid) {
      return NextResponse.json({ error: "This link is no longer valid. It may have expired or reached its maximum number of access attempts." }, { status: 400 });
    }

    const { request: simRequest } = await publicClient.simulateContract({
        account,
        address: contractAddress,
        abi: ShieldABI,
        functionName: 'logAttempt',
        args: [policyId, true],
    });

    const txHash = await walletClient.writeContract(simRequest);
    await publicClient.waitForTransactionReceipt({ hash: txHash });

    return NextResponse.json({ success: true, secretKey: policy.secret_key });

  } catch (error) {
    console.error("Error in /api/verify-siwe:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json({ error: "Failed to verify signature.", details: errorMessage }, { status: 500 });
  }
}