"use client";
 
import { useWeb3Modal } from "@web3modal/wagmi/react";
 
export default function ConnectButton() {
  const { open } = useWeb3Modal();
 
  return <button onClick={() => open()}>Connect Wallet</button>;
}