"use client";

import { useAccount, useReadContract } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import FactoryABI from "../../../../abis/FactoryContract.json";
const factoryContractAddress = process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`;

interface AdminAccessProps {
  children: React.ReactNode;
}

const AdminAccessComponent = ({ children }: AdminAccessProps) => {
  const { address, isConnected } = useAccount();
  
  const { data: adminAddress, isLoading: isLoadingAdminAddress, isError: isErrorAdminAddress } = useReadContract({
    address: factoryContractAddress,
    abi: FactoryABI,
    functionName: 'owner',
    args: isConnected ? [] : undefined
  });

  if (isErrorAdminAddress) {
    console.error("Error fetching admin address:", isErrorAdminAddress);
  }

  console.log("adminAddress", adminAddress);


  if (!isConnected) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8 rounded-lg bg-gray-50 dark:bg-gray-800">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
          Admin Access Required
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Please connect your wallet to access the admin panel
        </p>
        <ConnectButton />
      </div>
    );
  }

  if (isLoadingAdminAddress) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8 rounded-lg bg-gray-50 dark:bg-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 dark:border-gray-300 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">
          Verifying admin access...
        </p>
      </div>
    );
  }

  if (address?.toLowerCase() !== adminAddress?.toString().toLowerCase()) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8 rounded-lg bg-red-50 dark:bg-red-900/20">
        <svg
          className="w-16 h-16 text-red-500 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
          Unauthorized Access
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-center">
          This wallet does not have admin privileges.
          <br />
          Please connect with an admin wallet.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminAccessComponent;