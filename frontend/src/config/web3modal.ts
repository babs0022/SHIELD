import { createConfig, http } from 'wagmi'
import { injected, walletConnect } from 'wagmi/connectors'
import { chains } from './chains'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_WALLETCONNECT_PROJECT_ID'

const metadata = {
  name: 'Shield',
  description: 'Decentralized and secure file and message sharing.',
  url: 'https://shield-app.vercel.app',
  icons: ['https://shield-app.vercel.app/Shld.png']
}

export const wagmiConfig = createConfig({
  chains,
  transports: {
    ...chains.reduce((acc, chain) => ({ ...acc, [chain.id]: http() }), {}),
  } as any,
  connectors: [
    walletConnect({ projectId, metadata, showQrModal: false }),
    injected({ shimDisconnect: true }),
  ],
})
