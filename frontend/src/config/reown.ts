import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { cookieStorage, createStorage } from "wagmi";
import { chains } from "@/config/chains";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_REOWN_PROJECT_ID';

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: chains,
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
});
