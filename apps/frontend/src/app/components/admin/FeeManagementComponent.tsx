"use client"

import { useEffect, useState } from "react";
import { useReadContract, useWriteContract } from "wagmi";
import FactoryABI from "../../../../abis/FactoryContract.json";
import { toast } from "react-toastify";
import { ethers } from "ethers";
const factoryContractAddress = process.env.NEXT_PUBLIC_FACTORY_ADDRESS || "0x";



const FeeManagementComponent = () => {
    const [fee, setFee] = useState('0.0');
    // Contract reads
    const { data: projectFee, error: errorFee, isLoading: isLoadingFee } = useReadContract({
      address: factoryContractAddress as `0x${string}`,
      abi: FactoryABI,
      functionName: 'getFundingFee',
      args: []
    });

    const { data: contractBalance, isLoading: isLoadingBalance } = useReadContract({
      address: factoryContractAddress as `0x${string}`,
      abi: FactoryABI,
      functionName: 'getBalance',
      args: []
    });

    // Contract writes
    const {
      data: hash,
      error: errorWithdrawing,
      writeContract,
      isSuccess,
      isPending,
      isError,
    } = useWriteContract();

    const {
      data: hashUpdateFee,
      error: errorUpdateFee,
      writeContract: writeContractUpdateFee,
      isSuccess: isSuccessUpdateFee,
      isPending: isPendingUpdateFee,
      isError: isErrorUpdateFee,
    } = useWriteContract();

    
    useEffect(() => {
      if (isError || isErrorUpdateFee) {
        console.log("Error from mutation ", errorWithdrawing || errorUpdateFee);
        toast.error(`Error sending transaction: ${errorWithdrawing?.message || errorUpdateFee?.message}`, {
          position: "top-right",
        });
      }
    }, [isError, isErrorUpdateFee]);

    useEffect(() => {
      if (isSuccess || isSuccessUpdateFee) {
        toast.success("Transaction successful", {
          position: "top-right",
        });
        setFee('0.0');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }

    }, [isSuccess, isSuccessUpdateFee]);

    const handleWithdraw = () => {
      writeContract({
        address: factoryContractAddress as `0x${string}`,
        abi: FactoryABI,
        functionName: 'withdrawFunds',
        args: []
      });
    };

    const handleUpdateFee = () => {
      writeContractUpdateFee({
        address: factoryContractAddress as `0x${string}`,
        abi: FactoryABI,
        functionName: 'setFundingFee',
        args: [ethers.parseEther(fee)]
      });
    };


    return (
      <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-lg p-8 mb-6 border border-blue-100">
        <h2 className="text-2xl font-bold mb-6 text-blue-800 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Campaign Creation Fee Management
        </h2>
        
        <div className="mb-8 p-4 bg-white rounded-lg shadow-sm">
          {isLoadingFee ? (
            <div className="flex items-center gap-2 text-gray-600">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              Loading current fee...
            </div>
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-gray-600">Current Fee:</span>
              <span className="text-2xl font-bold text-blue-600">
                {projectFee ? ((+projectFee.toString()) / 1e18).toFixed(10) : '0.0'} BNB
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="w-full md:w-auto space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="number"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                className="w-full sm:w-[200px] px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                step="0.1"
                placeholder="Enter new fee"
              />
              <button 
                disabled={isPendingUpdateFee}
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 disabled:bg-blue-300 disabled:transform-none flex items-center justify-center gap-2 shadow-md"
                onClick={handleUpdateFee}
              >
                {isPendingUpdateFee ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Updating Fee...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Update Fee
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="w-full md:w-auto space-y-4">
            <div className="p-4 bg-white rounded-lg shadow-sm mb-4">
              {isLoadingBalance ? (
                <div className="flex items-center gap-2 text-gray-600">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  Loading balance...
                </div>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-gray-600">Balance:</span>
                  <span className="text-2xl font-bold text-green-600">
                    {contractBalance ? ((+contractBalance.toString()) / 1e18).toString() : '0.0'} BNB
                  </span>
                </div>
              )}
            </div>
            <button
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all transform hover:scale-105 disabled:bg-gray-400 disabled:transform-none flex items-center justify-center gap-2 shadow-md"
              onClick={handleWithdraw}
              disabled={isPending || !contractBalance || contractBalance == (0)}
            >
              {isPending ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Withdrawing...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Withdraw Balance
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

export default FeeManagementComponent;