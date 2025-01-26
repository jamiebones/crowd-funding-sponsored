import { defaultWagmiConfig } from "@web3modal/wagmi/react/config";
import { cookieStorage, createStorage } from "wagmi";
import { bscTestnet, bsc } from "wagmi/chains";
 
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
 
if (!projectId) throw new Error("Project ID is not defined");
 
const metadata = {
  name: "Crowd Funding",
  description: "Application for crowdfunding",
  url: "https://web3modal.com",
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
};
 
export const config = defaultWagmiConfig({
  chains: [bscTestnet, bsc],
  projectId,
  metadata,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
});