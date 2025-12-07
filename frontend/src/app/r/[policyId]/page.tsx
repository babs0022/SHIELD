import { Metadata } from 'next';
import ReceiverPageClient from './ReceiverPageClient';
import { Policy } from './ReceiverPageClient';

async function getPolicy(policyId: string): Promise<Policy | null> {
  try {
    const baseUrl = process.env.FRONTEND_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    
    const res = await fetch(`${baseUrl}/api/getPolicy/${policyId}`);
    if (!res.ok) {
      return null;
    }
    return res.json();
  } catch (error) {
    console.error('Failed to fetch policy:', error);
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: { policyId: string } }
): Promise<Metadata> {
  const resolvedParams = await params;
  const policyId = resolvedParams.policyId;
  const policy = await getPolicy(policyId);

  const baseUrl = process.env.FRONTEND_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  const title = 'Shield: Unlockable Content';
  const description = 'You have received unlockable content. Verify your wallet to view it.';
  const imageUrl = `${baseUrl}/ogimage.png`; 
  const url = `${baseUrl}/r/${policyId}`;

  if (!policy) {
    return {
      title,
      description,
    };
  }

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: [imageUrl],
      url: url,
    },
    other: {
      'fc:miniapp': JSON.stringify({
        version: '1',
        imageUrl: imageUrl,
        button: {
          title: 'View Content',
          action: {
            type: 'launch_frame',
            name: 'view-content',
            url: url
          }
        }
      }),
      'og:url': url,
    },
  };
}

export default async function ReceiverPage({ params }: { params: { policyId: string } }) {
  const resolvedParams = await params;
  const policy = await getPolicy(resolvedParams.policyId);
  return <ReceiverPageClient policy={policy} />;
}
