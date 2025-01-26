import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import WagmiProviderComp from "../lib/wagmi-provider";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import { cookieToInitialState } from "wagmi";
import { config } from "../lib/config";

const inter = Inter({ subsets: ["latin"] });

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Crowd Funding",
  description: "A dapp for crowdfunding. Raising funds for a project. Creators get their ideas funded and donors are protected by the smart contract by ensuring they can withdraw their funds if they no longer want to support the project.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialState = cookieToInitialState(config, (await headers()).get("cookie"));
 
  return (
    <html lang="en">
      <body className={inter.className}>
        <WagmiProviderComp initialState={initialState}>
          {children}
        </WagmiProviderComp>
      </body>
    </html>
  );
}