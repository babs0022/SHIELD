import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
  sepolia,
  localhost,
} from 'wagmi/chains';

export const chains = [
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
  sepolia,
  ...(process.env.NODE_ENV === 'development' ? [localhost] : [])
] as const;