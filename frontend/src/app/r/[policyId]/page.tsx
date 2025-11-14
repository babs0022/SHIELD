import { Metadata } from 'next';
import ReceiverPageClient from './ReceiverPageClient';
import { Policy } from './ReceiverPageClient';

async function getPolicy(policyId: string): Promise<Policy | null> {
  try {
    // TODO: use a better way to get the base URL
    const res = await fetch(`https://shield-app.vercel.app/api/getPolicy/${policyId}`);
    if (!res.ok) {
      return null;
    }
    return res.json();
  } catch (error) {
    console.error('Failed to fetch policy:', error);
    return null;
  }
}

type Props = {
  params: { policyId: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const policyId = params.policyId;
  const policy = await getPolicy(policyId);

  const title = 'Shield: Unlockable Content';
  const description = 'You have received unlockable content. Verify your wallet to view it.';
  const imageUrl = 'https://shield-app.vercel.app/ogimage.png'; 
  const url = `https://shield-app.vercel.app/r/${policyId}`;

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

export default async function ReceiverPage({ params }: Props) {
  const policy = await getPolicy(params.policyId);
  return <ReceiverPageClient policy={policy} />;
}
