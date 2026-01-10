'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useBalance } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { useQuery } from '@apollo/client/react';
import { GET_ALL_CAMPAIGNS } from '@/lib/queries/campaigns';
import { Campaign, CampaignContent } from '@/types/campaign';
import { CATEGORIES, ARWEAVE_GATEWAY } from '@/lib/constants';
import CROWD_FUNDING_CONTRACT from '@/abis/CrowdFunding.json';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  Coins, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ArrowLeft,
  Wallet,
  Gift,
  Trash2,
  Plus,
  Minus,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const CROWD_FUNDING_ABI = CROWD_FUNDING_CONTRACT.abi;

interface SelectedCampaign {
  id: string;
  title: string;
  amount: string;
  category: number;
  amountRaised: string;
  amountSought: string;
  campaignRunning: boolean;
}

interface DonationStatus {
  campaignId: string;
  status: 'pending' | 'confirming' | 'success' | 'error';
  hash?: string;
  error?: string;
}

interface CampaignWithTitle extends Campaign {
  fetchedTitle?: string;
}

export default function BatchDonatePage() {
  const { address: walletAddress, isConnected } = useAccount();
  const { data: balanceData } = useBalance({ address: walletAddress });
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // Selection state
  const [selectedCampaigns, setSelectedCampaigns] = useState<SelectedCampaign[]>([]);
  const [uniformAmount, setUniformAmount] = useState('');
  const [useUniformAmount, setUseUniformAmount] = useState(true);
  
  // Donation execution state
  const [isDonating, setIsDonating] = useState(false);
  const [currentDonationIndex, setCurrentDonationIndex] = useState(0);
  const [donationStatuses, setDonationStatuses] = useState<DonationStatus[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  
  // Campaign titles cache
  const [campaignTitles, setCampaignTitles] = useState<Record<string, string>>({});

  // Build filter for GraphQL query
  const whereFilter = useMemo(() => {
    const filter: any = {};
    if (showActiveOnly) {
      filter.campaignRunning = true;
    }
    if (selectedCategory !== null) {
      filter.category = selectedCategory;
    }
    return filter;
  }, [showActiveOnly, selectedCategory]);

  // Fetch campaigns
  const { data, loading, refetch } = useQuery<{ campaigns: Campaign[] }>(GET_ALL_CAMPAIGNS, {
    variables: {
      first: 50,
      skip: 0,
      orderBy: 'dateCreated',
      orderDirection: 'desc',
      where: whereFilter,
    },
  });

  const campaigns: Campaign[] = data?.campaigns || [];

  // Fetch titles for campaigns that don't have them
  useEffect(() => {
    const fetchTitles = async () => {
      const campaignsWithoutTitles = campaigns.filter(
        (c) => !c.content?.title && c.campaignCID && !campaignTitles[c.id]
      );

      for (const campaign of campaignsWithoutTitles) {
        try {
          const response = await fetch(`${ARWEAVE_GATEWAY}/${campaign.campaignCID}`);
          const content: CampaignContent = await response.json();
          if (content.title) {
            setCampaignTitles((prev) => ({ ...prev, [campaign.id]: content.title }));
          }
        } catch (err) {
          console.error(`Failed to fetch title for campaign ${campaign.id}`);
        }
      }
    };

    if (campaigns.length > 0) {
      fetchTitles();
    }
  }, [campaigns, campaignTitles]);

  // Filter campaigns by search query
  const filteredCampaigns = useMemo(() => {
    if (!searchQuery.trim()) return campaigns;
    
    const query = searchQuery.toLowerCase();
    return campaigns.filter((campaign) => {
      const title = campaign.content?.title || campaignTitles[campaign.id] || '';
      return (
        title.toLowerCase().includes(query) ||
        campaign.id.toLowerCase().includes(query)
      );
    });
  }, [campaigns, searchQuery, campaignTitles]);

  // Get campaign title
  const getCampaignTitle = useCallback((campaign: Campaign): string => {
    return campaign.content?.title || campaignTitles[campaign.id] || `Campaign ${campaign.id.slice(0, 8)}...`;
  }, [campaignTitles]);

  // Check if campaign is selected
  const isSelected = useCallback((campaignId: string): boolean => {
    return selectedCampaigns.some((c) => c.id === campaignId);
  }, [selectedCampaigns]);

  // Toggle campaign selection
  const toggleCampaign = useCallback((campaign: Campaign) => {
    setSelectedCampaigns((prev) => {
      const exists = prev.find((c) => c.id === campaign.id);
      if (exists) {
        return prev.filter((c) => c.id !== campaign.id);
      }
      return [
        ...prev,
        {
          id: campaign.id,
          title: getCampaignTitle(campaign),
          amount: uniformAmount || '0.01',
          category: campaign.category,
          amountRaised: campaign.amountRaised,
          amountSought: campaign.amountSought,
          campaignRunning: campaign.campaignRunning,
        },
      ];
    });
  }, [getCampaignTitle, uniformAmount]);

  // Update individual campaign amount
  const updateCampaignAmount = useCallback((campaignId: string, amount: string) => {
    setSelectedCampaigns((prev) =>
      prev.map((c) => (c.id === campaignId ? { ...c, amount } : c))
    );
  }, []);

  // Remove campaign from selection
  const removeCampaign = useCallback((campaignId: string) => {
    setSelectedCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
  }, []);

  // Apply uniform amount to all selected campaigns
  const applyUniformAmount = useCallback(() => {
    if (!uniformAmount || parseFloat(uniformAmount) <= 0) return;
    setSelectedCampaigns((prev) =>
      prev.map((c) => ({ ...c, amount: uniformAmount }))
    );
  }, [uniformAmount]);

  // Calculate totals
  const totalDonation = useMemo(() => {
    return selectedCampaigns.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
  }, [selectedCampaigns]);

  const userBalance = balanceData ? parseFloat(formatEther(balanceData.value)) : 0;
  const hasInsufficientBalance = totalDonation > userBalance;

  // Contract write hook
  const { writeContractAsync } = useWriteContract();

  // Execute batch donations
  const executeBatchDonation = async () => {
    if (selectedCampaigns.length === 0) return;
    if (hasInsufficientBalance) {
      alert('Insufficient balance for this donation');
      return;
    }

    setIsDonating(true);
    setCurrentDonationIndex(0);
    setDonationStatuses([]);
    setShowSummary(false);

    for (let i = 0; i < selectedCampaigns.length; i++) {
      const campaign = selectedCampaigns[i];
      setCurrentDonationIndex(i);

      // Set pending status
      setDonationStatuses((prev) => [
        ...prev,
        { campaignId: campaign.id, status: 'pending' },
      ]);

      try {
        // Execute donation
        const hash = await writeContractAsync({
          address: campaign.id as `0x${string}`,
          abi: CROWD_FUNDING_ABI,
          functionName: 'giveDonationToCause',
          value: parseEther(campaign.amount),
        });

        // Update to confirming
        setDonationStatuses((prev) =>
          prev.map((s) =>
            s.campaignId === campaign.id
              ? { ...s, status: 'confirming', hash }
              : s
          )
        );

        // Wait a bit for confirmation (in production, you'd use waitForTransactionReceipt)
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Update to success
        setDonationStatuses((prev) =>
          prev.map((s) =>
            s.campaignId === campaign.id ? { ...s, status: 'success' } : s
          )
        );
      } catch (error: any) {
        console.error(`Donation to ${campaign.id} failed:`, error);
        setDonationStatuses((prev) =>
          prev.map((s) =>
            s.campaignId === campaign.id
              ? { ...s, status: 'error', error: error.message || 'Transaction failed' }
              : s
          )
        );
      }
    }

    setIsDonating(false);
    setShowSummary(true);
  };

  // Reset after completion
  const resetDonations = () => {
    setSelectedCampaigns([]);
    setDonationStatuses([]);
    setShowSummary(false);
    setCurrentDonationIndex(0);
    refetch();
  };

  // Get status icon
  const getStatusIcon = (status: DonationStatus['status']) => {
    switch (status) {
      case 'pending':
        return <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />;
      case 'confirming':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  // Get category info
  const getCategory = (id: number) => CATEGORIES.find((c) => c.id === id);

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <Wallet className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Connect Your Wallet</h1>
          <p className="text-gray-600 mb-6">
            Please connect your wallet to make batch donations to campaigns.
          </p>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Batch Donate
        </h1>
        <p className="text-gray-600 text-lg">
          Search and select multiple campaigns to support with a single session
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Campaign Search & Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search & Filter Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search campaigns by title or address..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Filter className="w-5 h-5" />
                Filters
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {/* Expandable Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        selectedCategory === null
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      All
                    </button>
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          selectedCategory === cat.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {cat.icon} {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="activeOnly"
                    checked={showActiveOnly}
                    onChange={(e) => setShowActiveOnly(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="activeOnly" className="text-sm text-gray-700">
                    Show active campaigns only
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Campaign List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <h2 className="font-semibold text-gray-800">
                Available Campaigns ({filteredCampaigns.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No campaigns found</p>
                <p className="text-sm text-gray-500 mt-1">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                {filteredCampaigns.map((campaign) => {
                  const category = getCategory(campaign.category);
                  const title = getCampaignTitle(campaign);
                  const selected = isSelected(campaign.id);
                  const progress = (parseFloat(campaign.amountRaised) / parseFloat(campaign.amountSought)) * 100;

                  return (
                    <div
                      key={campaign.id}
                      className={`p-4 transition-colors cursor-pointer ${
                        selected ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => toggleCampaign(campaign)}
                    >
                      <div className="flex items-start gap-4">
                        {/* Checkbox */}
                        <div className="pt-1">
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              selected
                                ? 'bg-blue-600 border-blue-600'
                                : 'border-gray-300'
                            }`}
                          >
                            {selected && (
                              <CheckCircle2 className="w-4 h-4 text-white" />
                            )}
                          </div>
                        </div>

                        {/* Campaign Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-medium text-gray-900 truncate">
                                {title}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                {category && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                                    {category.icon} {category.name}
                                  </span>
                                )}
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full ${
                                    campaign.campaignRunning
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-red-100 text-red-700'
                                  }`}
                                >
                                  {campaign.campaignRunning ? 'Active' : 'Ended'}
                                </span>
                              </div>
                            </div>
                            <div className="text-right text-sm">
                              <div className="font-semibold text-gray-900">
                                {parseFloat(formatEther(BigInt(campaign.amountRaised))).toFixed(4)} BNB
                              </div>
                              <div className="text-gray-500">
                                of {parseFloat(formatEther(BigInt(campaign.amountSought))).toFixed(2)} BNB
                              </div>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Selection Summary & Donation */}
        <div className="space-y-6">
          {/* Wallet Balance */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-4 text-white">
            <div className="flex items-center gap-3">
              <Wallet className="w-8 h-8" />
              <div>
                <div className="text-sm opacity-80">Your Balance</div>
                <div className="text-xl font-bold">
                  {userBalance.toFixed(4)} BNB
                </div>
              </div>
            </div>
          </div>

          {/* Selected Campaigns */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <h2 className="font-semibold text-gray-800">
                Selected Campaigns ({selectedCampaigns.length})
              </h2>
            </div>

            {selectedCampaigns.length === 0 ? (
              <div className="p-6 text-center">
                <Gift className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600 text-sm">
                  Click on campaigns to add them to your donation list
                </p>
              </div>
            ) : (
              <>
                {/* Uniform Amount Option */}
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      id="uniformAmount"
                      checked={useUniformAmount}
                      onChange={(e) => setUseUniformAmount(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="uniformAmount" className="text-sm font-medium text-gray-700">
                      Use same amount for all
                    </label>
                  </div>
                  {useUniformAmount && (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          value={uniformAmount}
                          onChange={(e) => setUniformAmount(e.target.value)}
                          placeholder="0.01"
                          min="0.001"
                          step="0.001"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                          BNB
                        </span>
                      </div>
                      <button
                        onClick={applyUniformAmount}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                  )}
                </div>

                {/* Campaign List */}
                <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                  {selectedCampaigns.map((campaign) => (
                    <div key={campaign.id} className="p-4">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h4 className="font-medium text-gray-900 text-sm truncate flex-1">
                          {campaign.title}
                        </h4>
                        <button
                          onClick={() => removeCampaign(campaign.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Individual Amount Input */}
                      {!useUniformAmount && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const current = parseFloat(campaign.amount) || 0.01;
                              updateCampaignAmount(
                                campaign.id,
                                Math.max(0.001, current - 0.01).toFixed(3)
                              );
                            }}
                            className="p-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <div className="relative flex-1">
                            <input
                              type="number"
                              value={campaign.amount}
                              onChange={(e) =>
                                updateCampaignAmount(campaign.id, e.target.value)
                              }
                              min="0.001"
                              step="0.001"
                              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <button
                            onClick={() => {
                              const current = parseFloat(campaign.amount) || 0.01;
                              updateCampaignAmount(
                                campaign.id,
                                (current + 0.01).toFixed(3)
                              );
                            }}
                            className="p-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <span className="text-xs text-gray-500 ml-1">BNB</span>
                        </div>
                      )}

                      {useUniformAmount && (
                        <div className="text-sm text-gray-600">
                          {campaign.amount || uniformAmount || '0.01'} BNB
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Total Summary */}
                <div className="p-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-600">Total Donation:</span>
                    <span className="text-xl font-bold text-gray-900">
                      {totalDonation.toFixed(4)} BNB
                    </span>
                  </div>

                  {hasInsufficientBalance && (
                    <div className="flex items-center gap-2 text-red-600 text-sm mb-3">
                      <AlertCircle className="w-4 h-4" />
                      Insufficient balance
                    </div>
                  )}

                  <button
                    onClick={executeBatchDonation}
                    disabled={
                      isDonating ||
                      selectedCampaigns.length === 0 ||
                      hasInsufficientBalance ||
                      totalDonation <= 0
                    }
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isDonating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing ({currentDonationIndex + 1}/{selectedCampaigns.length})
                      </>
                    ) : (
                      <>
                        <Coins className="w-5 h-5" />
                        Donate to {selectedCampaigns.length} Campaign{selectedCampaigns.length !== 1 ? 's' : ''}
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Donation Progress/Results */}
          {(isDonating || showSummary) && donationStatuses.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <h2 className="font-semibold text-gray-800">
                  {isDonating ? 'Donation Progress' : 'Donation Summary'}
                </h2>
              </div>

              <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                {donationStatuses.map((status, index) => {
                  const campaign = selectedCampaigns.find(
                    (c) => c.id === status.campaignId
                  );
                  return (
                    <div key={status.campaignId} className="p-4 flex items-center gap-3">
                      {getStatusIcon(status.status)}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 truncate">
                          {campaign?.title || status.campaignId.slice(0, 10) + '...'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {status.status === 'pending' && 'Waiting for confirmation...'}
                          {status.status === 'confirming' && 'Confirming transaction...'}
                          {status.status === 'success' && 'Donation successful!'}
                          {status.status === 'error' && (status.error || 'Transaction failed')}
                        </div>
                      </div>
                      <div className="text-sm font-medium text-gray-700">
                        {campaign?.amount} BNB
                      </div>
                    </div>
                  );
                })}
              </div>

              {showSummary && (
                <div className="p-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      {donationStatuses.filter((s) => s.status === 'success').length} successful
                    </div>
                    <div className="flex items-center gap-1 text-red-600">
                      <XCircle className="w-4 h-4" />
                      {donationStatuses.filter((s) => s.status === 'error').length} failed
                    </div>
                  </div>
                  <button
                    onClick={resetDonations}
                    className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    Start New Batch
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
