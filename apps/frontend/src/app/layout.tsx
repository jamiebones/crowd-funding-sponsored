import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Inter } from "next/font/google";
import { Bounce, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AppKitProvider from "../lib/rainbow-kit-provider";
import Navbar from "./components/Navbar";
const inter = Inter({ subsets: ["latin"] });
import { usePathname } from 'next/navigation';

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
 
 
  return (
    <html lang="en">
      <body className={inter.className}>
      <AppKitProvider>
        <Navbar />
          {children}
          <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
                transition={Bounce}
              />
        </AppKitProvider>
       
      </body>
    </html>
  );
}

