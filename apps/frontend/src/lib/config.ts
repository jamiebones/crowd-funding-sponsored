import { defaultWagmiConfig } from "@web3modal/wagmi/react/config";
import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { bscTestnet, bsc } from "wagmi/chains";






import { cookieStorage, createStorage } from "wagmi";

 
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
 
if (!projectId) throw new Error("Project ID is not defined");
 


const config = getDefaultConfig({
  appName: 'Crowd Funding',
  projectId: projectId,
  chains: [bscTestnet, bsc],
  ssr: true, // If your dApp uses server side rendering (SSR)
});

export default config;
 
// export const config = defaultWagmiConfig({
//   chains: [bscTestnet, bsc],
//   projectId,
//   metadata,
//   ssr: true,
//   storage: createStorage({
//     storage: cookieStorage,
//   }),
// });