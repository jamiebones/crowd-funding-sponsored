import { useEffect, useState } from 'react';
import { useWriteContract } from 'wagmi';
import FactoryABI from "../../../../abis/FactoryContract.json";
import { toast } from 'react-toastify';
const factoryContractAddress = process.env.NEXT_PUBLIC_FACTORY_ADDRESS || "0x";

const TransferContractOwnership = () => {
  const [newOwnerAddress, setNewOwnerAddress] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [error, setError] = useState('');

  const {
    data: hash,
    error: errorTransferring,
    writeContract,
    isSuccess,
    isPending,
    isError,
  } = useWriteContract();

  useEffect(() => {
    if (isError) {
      console.log("Error from mutation ", errorTransferring);
      toast.error(`Error sending transaction: ${errorTransferring?.message}`, {
        position: "top-right",
      });
    }
  }, [isError]);

  useEffect(() => {
    if (isSuccess) {
      toast.success("Transaction successful", {
        position: "top-right",
      });
    }
    window.location.reload();

  }, [isSuccess]);


  const handleTransferOwnership = async () => {
    try {
      // Add your contract interaction logic here
      console.log('Transferring ownership to:', newOwnerAddress);
      setOpenDialog(false);
      setNewOwnerAddress('');
      writeContract({
        address: factoryContractAddress as `0x${string}`,
        abi: FactoryABI,
        functionName: 'transferOwnership',
        args: [newOwnerAddress]
      });
    } catch (err) {
      setError('Failed to transfer ownership. Please try again.');
    }
  };

  const validateAddress = (address: string) => {
    return address.startsWith('0x') && address.length === 42;
  };

  return (
    <div className="w-full p-8">
      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <svg
            className="w-8 h-8 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <h2 className="text-2xl font-bold text-gray-800">
            Transfer Contract Ownership
          </h2>
        </div>

        {/* Description */}
        <p className="text-gray-600 mb-6">
          Enter the wallet address of the new contract owner. This action cannot be undone.
        </p>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 flex justify-between items-center">
            <span>{error}</span>
            <button
              onClick={() => setError('')}
              className="text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        )}

        {/* Input Field */}
        <div className="mb-6">
          <input
            type="text"
            value={newOwnerAddress}
            onChange={(e) => setNewOwnerAddress(e.target.value)}
            placeholder="0x..."
            className={`w-full px-4 py-3 rounded-lg border ${
              newOwnerAddress !== '' && !validateAddress(newOwnerAddress)
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            } focus:border-transparent focus:outline-none focus:ring-2`}
          />
          {newOwnerAddress !== '' && !validateAddress(newOwnerAddress) && (
            <p className="mt-2 text-sm text-red-600">
              Please enter a valid Ethereum address
            </p>
          )}
        </div>

        {/* Transfer Button */}
        <button
          onClick={() => setOpenDialog(true)}
          disabled={!validateAddress(newOwnerAddress)}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold
            disabled:opacity-50 disabled:cursor-not-allowed
            hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            transition-colors duration-200"
        >
           {isPending ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div> : "Transfer Ownership"}
        </button>
      </div>

      {/* Confirmation Dialog */}
      {openDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Confirm Ownership Transfer
            </h3>
            <p className="text-gray-600 mb-2">
              Are you sure you want to transfer the contract ownership to:
            </p>
            <p className="font-mono bg-gray-50 p-3 rounded-lg text-sm mb-4 break-all">
              {newOwnerAddress}
            </p>
            <p className="text-red-600 text-sm mb-6">
              Warning: This action cannot be undone. Make sure the address is correct.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setOpenDialog(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Cancel
              </button>
              <button
                disabled={isPending}
                onClick={handleTransferOwnership}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg
                  hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {isPending ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div> : "Confirm Transfer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferContractOwnership;
