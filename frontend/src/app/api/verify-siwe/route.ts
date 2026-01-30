import { NextResponse } from 'next/server';
import { SiweMessage } from 'siwe';
import sql from '@/lib/db';
import { createPublicClient, createWalletClient, http, Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { ShieldABI } from '@/lib/ShieldABI';
import { z } from 'zod';

const siweSchema = z.object({
  message: z.any(),
  signature: z.string(),
  policyId: z.string(),
});


const rpcUrl = process.env.BASE_MAINNET_RPC_URL;
const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as Hex | undefined;
const publicClient = createPublicClient({
  chain: base,
  transport: http(rpcUrl),
});

export async function POST(request: Request) {
  const body = await request.json();
  const validation = siweSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: "Invalid request.", details: validation.error.flatten() }, { status: 400 });
  }

  const { message, signature, policyId } = validation.data;

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

    return NextResponse.json({ success: true });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json({ error: "Failed to verify signature.", details: errorMessage }, { status: 500 });
  }
}