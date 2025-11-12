import { CampaignFormData } from '@/app/new-project/page';
import Link from 'next/link';
import { ExternalLink, Home, Share2, Eye, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useChainId } from 'wagmi';

interface SuccessProps {
  formData: CampaignFormData;
}

export function Success({ formData }: SuccessProps) {
  const [confettiActive, setConfettiActive] = useState(true);
  const chainId = useChainId();

  // Get block explorer URL based on chain
  const getBlockExplorerUrl = (txHash: string) => {
    const baseUrl = chainId === 56 
      ? 'https://bscscan.com' 
      : 'https://testnet.bscscan.com';
    return `${baseUrl}/tx/${txHash}`;
  };

  useEffect(() => {
    // Disable confetti after 5 seconds
    const timer = setTimeout(() => setConfettiActive(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleShare = async () => {
    const shareData = {
      title: formData.title,
      text: `Check out my campaign: ${formData.title}`,
      url: formData.campaignAddress 
        ? `${window.location.origin}/projects/${formData.campaignAddress}`
        : window.location.origin,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareData.url);
        alert('Campaign link copied to clipboard!');
      }
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  return (
    <div className="space-y-8 text-center">
      {/* Confetti Effect (simple CSS animation) */}
      {confettiActive && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
          <div className="confetti-container">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][
                    Math.floor(Math.random() * 5)
                  ],
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Success Icon */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-green-500 opacity-20 blur-2xl rounded-full animate-pulse" />
          <CheckCircle2 className="w-24 h-24 text-green-500 relative" />
        </div>
      </div>

      {/* Success Message */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          🎉 Campaign Created Successfully!
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Your campaign <strong>{formData.title}</strong> has been deployed on the Binance Smart
          Chain. Start sharing it with potential donors!
        </p>
      </div>

      {/* Campaign Details */}
      <div className="bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 max-w-2xl mx-auto">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          Campaign Details
        </h3>
        
        <div className="space-y-3 text-left">
          {formData.campaignAddress && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Transaction Hash</p>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-sm bg-white dark:bg-gray-800 px-3 py-1 rounded border border-gray-300 dark:border-gray-600 flex-1 font-mono">
                  {formData.campaignAddress}
                </code>
                <a
                  href={getBlockExplorerUrl(formData.campaignAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700"
                  title="View on Block Explorer"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}

          {formData.arweaveTxId && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Arweave Transaction</p>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-sm bg-white dark:bg-gray-800 px-3 py-1 rounded border border-gray-300 dark:border-gray-600 flex-1 font-mono truncate">
                  {formData.arweaveTxId}
                </code>
                <a
                  href={`https://arweave.net/${formData.arweaveTxId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Funding Goal</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {formData.goal} BNB
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {formData.duration} days
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 max-w-2xl mx-auto text-left">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
          📋 Next Steps
        </h3>
        <ol className="text-sm text-gray-700 dark:text-gray-300 space-y-2 list-decimal list-inside">
          <li>Share your campaign with potential donors on social media</li>
          <li>Monitor donations and engagement on your dashboard</li>
          <li>Create milestones as your project progresses (max 3)</li>
          <li>Keep donors updated on your progress</li>
          <li>Once a milestone is complete, submit it for community voting</li>
        </ol>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-2xl mx-auto pt-4">
        {formData.campaignAddress && (
          <Link
            href={`/projects/${formData.campaignAddress}`}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            <Eye className="w-5 h-5" />
            View Campaign
          </Link>
        )}

        <button
          onClick={handleShare}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
        >
          <Share2 className="w-5 h-5" />
          Share Campaign
        </button>

        <Link
          href="/dashboard"
          className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <Home className="w-5 h-5" />
          Go to Dashboard
        </Link>
      </div>

      {/* Additional Info */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 max-w-2xl mx-auto">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          💡 <strong>Tip:</strong> Your campaign will appear on the platform within a few minutes
          after the blockchain confirms the transaction. The subgraph indexer will pick up your
          campaign and make it searchable.
        </p>
      </div>

      <style jsx>{`
        .confetti-container {
          position: relative;
          width: 100%;
          height: 100%;
        }
        
        .confetti {
          position: absolute;
          width: 10px;
          height: 10px;
          top: -10px;
          animation: fall 3s linear infinite;
        }
        
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
