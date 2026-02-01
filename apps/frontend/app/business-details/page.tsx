'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter, useSearchParams } from 'next/navigation';
import BusinessDetailsForm from '@/components/campaign/BusinessDetailsForm';
import { Briefcase, Shield, Info, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { CONTRACTS } from '@/lib/constants';

export default function AddBusinessDetailsPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const searchParams = useSearchParams();
  const campaignAddress = searchParams.get('campaign');
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is admin (factory owner)
    // You can add actual admin check logic here
    const checkAdmin = async () => {
      // For now, just set to false, you can add admin wallet check
      setIsAdmin(false);
      setLoading(false);
    };

    if (isConnected && address) {
      checkAdmin();
    } else {
      setLoading(false);
    }
  }, [address, isConnected]);

  // Redirect if not connected
  if (!isConnected || !address) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 text-center">
          <div className="bg-red-100 dark:bg-red-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Wallet Not Connected
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please connect your wallet to add business details for campaigns.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-xl">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Add Business Details
                  </h1>
                  {isAdmin && (
                    <div className="flex items-center gap-2 mt-1">
                      <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                        Admin Access
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
                Provide comprehensive business plan details for your campaign. This helps potential backers understand your vision, strategy, and financial projections.
              </p>
            </div>
            
            <Link
              href={campaignAddress ? `/projects/${campaignAddress}` : '/dashboard'}
              className="hidden sm:flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          </div>

          {/* Info Banner */}
          <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  About Business Details
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Business details are optional but highly recommended. They provide transparency and build trust with potential backers. You can save your progress and come back later to complete all sections.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BusinessDetailsForm
          campaignAddress={campaignAddress || undefined}
          ownerAddress={address!}
          isAdmin={isAdmin}
          onSuccess={() => {
            if (campaignAddress) {
              router.push(`/projects/${campaignAddress}`);
            } else {
              router.push('/dashboard');
            }
          }}
        />
      </div>
    </div>
  );
}
