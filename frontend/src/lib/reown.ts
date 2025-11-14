import { mainnet } from 'wagmi/chains';
import { ReownAuthentication } from '@reown/appkit-siwx';
import { createAppKit } from '@reown/appkit';

export const appkit = createAppKit({
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
  siwx: new ReownAuthentication(),
  networks: [mainnet],
});
