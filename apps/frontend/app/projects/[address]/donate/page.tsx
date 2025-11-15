'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { useQuery } from '@apollo/client/react';
import { GET_CAMPAIGN_DETAIL } from '@/lib/queries/campaign-detail';
import { Campaign, CampaignContent } from '@/types/campaign';
import { CATEGORIES } from '@/lib/constants';
import CROWD_FUNDING_CONTRACT from '@/abis/CrowdFunding.json';
import { Loader2, Heart, Coins, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const CROWD_FUNDING_ABI = CROWD_FUNDING_CONTRACT.abi;

export default function DonatePage() {
  const params = useParams();
  const router = useRouter();
  const addressParam = params.address as string;
  const { address: walletAddress, isConnected } = useAccount();

  // Use the address directly as campaign ID (lowercased for consistency)
  const campaignId = addressParam.toLowerCase();

  // The contract address is the same as the campaign ID
  const contractAddress = addressParam;

  const [amount, setAmount] = useState('');
  const [email, setEmail] = useState('');
  const [wantUpdates, setWantUpdates] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [donationSuccess, setDonationSuccess] = useState(false);
  const [campaignTitle, setCampaignTitle] = useState<string>('');

  const { data, loading: campaignLoading } = useQuery(GET_CAMPAIGN_DETAIL, {
    variables: { id: campaignId },
    skip: !addressParam,
  });

  const campaign: Campaign | undefined = (data as any)?.campaign;

  // Fetch campaign title from Arweave if not in subgraph
  useEffect(() => {
    if (campaign && !campaign.content?.title && campaign.campaignCID) {
      const abortController = new AbortController();
      
      fetch(`https://arweave.net/${campaign.campaignCID}`, {
        signal: abortController.signal,
      })
        .then((res) => res.json())
        .then((content: CampaignContent) => {
          if (content.title) {
            setCampaignTitle(content.title);
          }
        })
        .catch((err) => {
          if (err.name !== 'AbortError') {
            console.error('Failed to fetch campaign title:', err);
          }
        });

      return () => {
        abortController.abort();
      };
    }
  }, [campaign]);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Redirect if not connected
  useEffect(() => {
    if (!isConnected) {
      router.push(`/projects/${addressParam}`);
    }
  }, [isConnected, router, addressParam]);

  // Handle donation success
  useEffect(() => {
    if (isSuccess && !donationSuccess) {
      setDonationSuccess(true);
      
      // Save email if provided
      if (wantUpdates && email && validateEmail(email)) {
        saveEmailPreference();
      }
    }
  }, [isSuccess, donationSuccess, wantUpdates, email]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    return emailRegex.test(email);
  };

  const saveEmailPreference = async () => {
    try {
      const response = await fetch('/api/save-donor-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          email: email.toLowerCase(),
          campaignId: campaignId,
          campaignTitle: campaignTitle || campaign?.content?.title || campaign?.title || 'Campaign',
          donationAmount: `${amount} BNB`,
        }),
      });

      if (!response.ok) {
        console.error('Failed to save email preference');
      }
    } catch (error) {
      console.error('Error saving email preference:', error);
    }
  };

  const handleDonate = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (wantUpdates && !email) {
      setEmailError('Email is required for updates');
      return;
    }

    if (wantUpdates && email && !validateEmail(email)) {
      setEmailError('Please enter a valid email');
      return;
    }

    try {
      writeContract({
        address: contractAddress as `0x${string}`,
        abi: CROWD_FUNDING_ABI,
        functionName: 'giveDonationToCause',
        value: parseEther(amount),
      });
    } catch (error) {
      console.error('Donation error:', error);
    }
  };

  if (!isConnected) {
    return null;
  }

  if (campaignLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Campaign not found
          </h1>
          <Link
            href="/projects"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Browse campaigns
          </Link>
        </div>
      </div>
    );
  }

  const categoryInfo = CATEGORIES.find((cat) => cat.id === campaign.category);
  const tokensToEarn = amount ? parseFloat(amount) : 0;

  // Success modal
  if (donationSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Thank You for Your Support! 🎉
            </h1>
            
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
              Your donation of <strong>{amount} BNB</strong> has been successfully processed.
            </p>

            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Coins className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  +{tokensToEarn} MWG-DT
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tokens earned for this donation
              </p>
            </div>

            {wantUpdates && email && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    Email Updates Enabled
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  We'll send updates to {email}
                </p>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <Link
                href={`/projects/${addressParam}`}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                View Campaign
              </Link>
              <Link
                href="/dashboard"
                className="px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          href={`/projects/${addressParam}`}
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Campaign
        </Link>

        {/* Campaign Info Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl">{categoryInfo?.icon || '📦'}</div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {campaignTitle || campaign.content?.title || campaign.title || 'Untitled Campaign'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Support this campaign and earn MWG-DT tokens
              </p>
            </div>
          </div>
        </div>

        {/* Donation Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Make a Donation
          </h2>

          {/* Amount Input */}
          <div className="mb-6">
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Donation Amount (BNB) *
            </label>
            <div className="relative">
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.1"
                step="0.001"
                min="0"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-semibold">
                BNB
              </div>
            </div>
          </div>

          {/* Token Preview */}
          {tokensToEarn > 0 && (
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    You'll earn:
                  </span>
                </div>
                <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  {tokensToEarn} MWG-DT
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                Use these tokens to vote on milestones
              </p>
            </div>
          )}

          {/* Email Updates Section */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <input
                type="checkbox"
                id="wantUpdates"
                checked={wantUpdates}
                onChange={(e) => setWantUpdates(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <label
                  htmlFor="wantUpdates"
                  className="block font-medium text-gray-900 dark:text-white cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Get campaign updates via email</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-normal">
                    Receive notifications when milestones are created, approved, or when the campaign ends
                  </p>
                </label>
              </div>
            </div>

            {wantUpdates && (
              <div className="mt-4">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError('');
                  }}
                  placeholder="your@email.com"
                  className={`w-full px-4 py-2 bg-white dark:bg-gray-900 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white ${
                    emailError
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {emailError && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {emailError}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Donate Button */}
          <button
            onClick={handleDonate}
            disabled={isPending || isConfirming || !amount || parseFloat(amount) <= 0}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold px-6 py-4 rounded-lg transition-colors shadow-lg shadow-blue-600/30"
          >
            {isPending || isConfirming ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {isPending ? 'Confirm in Wallet...' : 'Processing...'}
              </>
            ) : (
              <>
                <Heart className="w-5 h-5" />
                Donate {amount || '0'} BNB
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
            By donating, you agree to the platform's terms and conditions
          </p>
        </div>
      </div>
    </div>
  );
}
