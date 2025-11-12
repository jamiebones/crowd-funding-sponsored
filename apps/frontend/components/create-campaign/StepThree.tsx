import { CampaignFormData } from '@/app/new-project/page';
import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useChainId, useReadContract } from 'wagmi';
import { parseEther, decodeEventLog, formatEther } from 'viem';
import { FACTORY_ADDRESS, CATEGORIES } from '@/lib/constants';
import FactoryABI from '@/abis/CrowdFundingFactory.json';
import { Abi } from 'viem';
import { AlertCircle, Loader2, ExternalLink } from 'lucide-react';

interface StepThreeProps {
  formData: CampaignFormData;
  onBack: () => void;
  onSuccess: (campaignAddress: string, arweaveTxId: string) => void;
}

export function StepThree({ formData, onBack, onSuccess }: StepThreeProps) {
  const [error, setError] = useState<string>('');
  const chainId = useChainId();

  // Read current platform fee from contract
  const { data: platformFee, isLoading: isFeeLoading } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FactoryABI.abi as Abi,
    functionName: 'getFundingFee',
  });

  const { writeContract, data: hash, isPending, isError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({
    hash,
  });

  const category = CATEGORIES.find(c => c.id === formData.category);
  
  // Get block explorer URL based on chain
  const getBlockExplorerUrl = (txHash: string) => {
    const baseUrl = chainId === 56 
      ? 'https://bscscan.com' 
      : 'https://testnet.bscscan.com';
    return `${baseUrl}/tx/${txHash}`;
  };

  const handleCreate = async () => {
    try {
      setError('');

      if (!formData.arweaveTxId) {
        setError('Campaign content not uploaded. Please go back and upload your content.');
        return;
      }

      if (!platformFee) {
        setError('Unable to read platform fee. Please try again.');
        return;
      }

      // Call createNewCrowdFundingContract
      writeContract({
        address: FACTORY_ADDRESS,
        abi: FactoryABI.abi as Abi,
        functionName: 'createNewCrowdFundingContract',
        args: [
          formData.arweaveTxId, // detailsId (Arweave TX ID)
          formData.category, // category (enum)
          formData.title, // title
          parseEther(formData.goal), // amountSought (in wei)
          BigInt(formData.duration * 24 * 60 * 60), // duration (in seconds)
        ],
        value: platformFee as bigint, // Dynamic platform fee from contract
      } as any);

    } catch (err) {
      console.error('Transaction error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create campaign');
    }
  };

  // Handle success - extract campaign address from logs
  useEffect(() => {
    if (isSuccess && receipt && formData.arweaveTxId) {
      // Find the NewCrowdFundingContractCreated event in the logs
      const campaignCreatedLog = receipt.logs.find(log => {
        try {
          const decoded = decodeEventLog({
            abi: FactoryABI.abi as Abi,
            data: log.data,
            topics: log.topics,
          });
          return decoded.eventName === 'NewCrowdFundingContractCreated';
        } catch {
          return false;
        }
      });

      if (campaignCreatedLog) {
        try {
          const decoded = decodeEventLog({
            abi: FactoryABI.abi as Abi,
            data: campaignCreatedLog.data,
            topics: campaignCreatedLog.topics,
          });
          
          // The event returns: (owner, contractAddress, detailsId, title, category, duration, goal)
          const campaignAddress = (decoded.args as any).contractAddress;
          
          if (campaignAddress) {
            onSuccess(campaignAddress, formData.arweaveTxId);
          } else {
            setError('Could not extract campaign address from transaction');
          }
        } catch (err) {
          console.error('Error decoding event log:', err);
          setError('Failed to extract campaign address from transaction');
        }
      } else {
        setError('Campaign creation event not found in transaction logs');
      }
    }
  }, [isSuccess, receipt, formData.arweaveTxId, onSuccess]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Review & Create
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Review your campaign details before creating on-chain
        </p>
      </div>

      {/* Campaign Summary */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Campaign Summary
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Title</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {formData.title}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Category</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {category?.icon} {category?.name}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Funding Goal</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {formData.goal} BNB
            </p>
            <p className="text-xs text-gray-500">
              ≈ ${(parseFloat(formData.goal) * 600).toLocaleString()} USD
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {formData.duration} days
            </p>
            <p className="text-xs text-gray-500">
              Ends {new Date(Date.now() + formData.duration * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Description</p>
          <p className="text-sm text-gray-900 dark:text-white line-clamp-3">
            {formData.description}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Media Files</p>
          <p className="text-sm text-gray-900 dark:text-white">
            {formData.files.length} file(s) uploaded
          </p>
        </div>

        {formData.arweaveTxId && (
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Arweave Storage</p>
            <a
              href={`https://arweave.net/${formData.arweaveTxId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View on Arweave <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>

      {/* Cost Breakdown */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
          💰 Cost Breakdown
        </h4>
        {isFeeLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading fee information...
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-700 dark:text-gray-300">Platform Fee:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {platformFee ? formatEther(platformFee as bigint) : '0'} BNB
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700 dark:text-gray-300">Arweave Storage:</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                FREE (Platform Subsidized)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700 dark:text-gray-300">Estimated Gas Fee:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                ~0.0005 BNB
              </span>
            </div>
            <div className="pt-2 border-t border-blue-200 dark:border-blue-700 flex justify-between">
              <span className="font-semibold text-gray-900 dark:text-white">Total:</span>
              <span className="font-bold text-gray-900 dark:text-white">
                ~{platformFee ? (parseFloat(formatEther(platformFee as bigint)) + 0.0005).toFixed(7) : '0.0005'} BNB
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {(error || isError) && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error || 'Transaction failed. Please try again.'}
          </p>
        </div>
      )}

      {/* Transaction Status */}
      {isPending && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Waiting for wallet confirmation...
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Please confirm the transaction in your wallet
              </p>
            </div>
          </div>
        </div>
      )}

      {isConfirming && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Transaction submitted! Waiting for confirmation...
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                This may take a few seconds
              </p>
              {hash && (
                <a
                  href={getBlockExplorerUrl(hash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-1"
                >
                  View on BscScan <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
          ℹ️ What Happens Next?
        </h4>
        <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
          <li>• Your campaign will be deployed as a smart contract on BSC</li>
          <li>• Content is permanently stored on Arweave</li>
          <li>• Campaign will appear on the platform within minutes</li>
          <li>• You can create up to 3 milestones as your project progresses</li>
          <li>• Donors will receive MWG-DT tokens equal to their donation amount</li>
        </ul>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onBack}
          disabled={isPending || isConfirming}
          className="px-8 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={handleCreate}
          disabled={isPending || isConfirming || !formData.arweaveTxId || isFeeLoading || !platformFee}
          className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isPending || isConfirming ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating Campaign...
            </>
          ) : isFeeLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading Fee...
            </>
          ) : (
            '🚀 Create Campaign'
          )}
        </button>
      </div>
    </div>
  );
}
