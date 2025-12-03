'use client';

import { useParams } from 'next/navigation';
import { useWaitForTransactionReceipt } from 'wagmi';
import { CheckCircle2, XCircle, Loader2, ExternalLink, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const BLOCK_EXPLORER = process.env.NEXT_PUBLIC_BLOCK_EXPLORER || 'https://testnet.bscscan.com';

export default function TransactionStatusPage() {
  const params = useParams();
  const hash = params.hash as `0x${string}`;

  const { data: receipt, isLoading, isSuccess, isError } = useWaitForTransactionReceipt({
    hash,
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Transaction Status
          </h1>

          {/* Transaction Hash */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Transaction Hash
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-900 rounded text-sm text-gray-900 dark:text-white font-mono overflow-x-auto">
                {hash}
              </code>
              <a
                href={`${BLOCK_EXPLORER}/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-sm"
              >
                View on Explorer
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Status Display */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            {isLoading && (
              <div className="text-center py-12">
                <Loader2 className="w-16 h-16 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Confirming Transaction...
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Waiting for blockchain confirmation
                </p>
              </div>
            )}

            {isSuccess && receipt && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Transaction Confirmed!
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  Your transaction has been successfully confirmed on the blockchain
                </p>

                {/* Transaction Details */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 space-y-4 text-left">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Block Number</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {receipt.blockNumber.toString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Block Hash</span>
                    <code className="text-xs text-gray-900 dark:text-white font-mono">
                      {receipt.blockHash.slice(0, 10)}...{receipt.blockHash.slice(-8)}
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Gas Used</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {receipt.gasUsed.toString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Status</span>
                    <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      Success
                    </span>
                  </div>
                </div>
              </div>
            )}

            {isError && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Transaction Failed
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  The transaction could not be confirmed. It may have been reverted or cancelled.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Go Home
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
