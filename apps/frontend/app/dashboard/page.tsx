'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useQuery } from '@apollo/client/react';
import { useRouter } from 'next/navigation';
import { GET_DASHBOARD_STATS } from '@/lib/queries/dashboard';
import { Wallet, LayoutDashboard, Heart, Vote, Coins } from 'lucide-react';
import { MyCampaigns } from '@/components/dashboard/MyCampaigns';
import { MyDonations } from '@/components/dashboard/MyDonations';
import { MyVotes } from '@/components/dashboard/MyVotes';
import { MyTokens } from '@/components/dashboard/MyTokens';

type TabType = 'campaigns' | 'donations' | 'votes' | 'tokens';

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('campaigns');
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    }
  }, [isConnected]);

  const { data, loading, error } = useQuery(GET_DASHBOARD_STATS, {
    variables: { address: address?.toLowerCase() },
    skip: !address,
    fetchPolicy: 'network-only'
  });

  useEffect(() => {
    if (data) {
      console.log('Dashboard data received:', data);
      setStats(data);
    }
  }, [data]);

  if (!isConnected && data === undefined) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading user dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error loading dashboard: {error.message}</p>
        </div>
      </div>
    );
  }

  // Use data directly from query, fallback to stats state
  const dashboardData = data || stats;

  console.log("Dashboard data being used:", dashboardData);

  const campaignsCreated = dashboardData.campaignCreator?.totalCampaigns 
    ? parseInt(dashboardData.campaignCreator.totalCampaigns) 
    : dashboardData.campaigns?.length || 0;
  
  console.log("stats values", dashboardData.donor?.totalDonated);
  const totalRaised = dashboardData.campaignCreator?.fundingGiven || '0';
  const totalDonated = dashboardData.donor?.totalDonated || '0';
  const votesCast = dashboardData.votes?.length || 0;

  const tabs = [
    {
      id: 'campaigns' as TabType,
      label: 'My Campaigns',
      icon: LayoutDashboard,
      count: dashboardData.campaigns?.length || 0,
    },
    {
      id: 'donations' as TabType,
      label: 'My Donations',
      icon: Heart,
      count: dashboardData.donations?.length || 0,
    },
    {
      id: 'votes' as TabType,
      label: 'My Votes',
      icon: Vote,
      count: dashboardData.votes?.length || 0,
    },
    {
      id: 'tokens' as TabType,
      label: 'My Tokens',
      icon: Coins,
      count: null,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Dashboard 
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your campaigns, donations, and activity
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                    Campaigns Created
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {campaignsCreated}
                  </p>
                </div>
                <LayoutDashboard className="w-8 h-8 text-blue-600 dark:text-blue-400 opacity-50" />
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                    Total Raised
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {(parseFloat(totalRaised) / 1e18).toFixed(2)} BNB
                  </p>
                </div>
                <Coins className="w-8 h-8 text-green-600 dark:text-green-400 opacity-50" />
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                    Total Donated
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {dashboardData.donor?.totalDonated / 1e18}  BNB
                  </p>
                </div>
                <Heart className="w-8 h-8 text-purple-600 dark:text-purple-400 opacity-50" />
              </div>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                    Votes Cast
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {votesCast}
                  </p>
                </div>
                <Vote className="w-8 h-8 text-orange-600 dark:text-orange-400 opacity-50" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px space-x-8 overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                    ${isActive
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                  {tab.count !== null && (
                    <span className={`
                      ml-2 py-0.5 px-2 rounded-full text-xs font-medium
                      ${isActive
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }
                    `}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="py-8">
          {activeTab === 'campaigns' && <MyCampaigns address={address!} />}
          {activeTab === 'donations' && <MyDonations address={address!} />}
          {activeTab === 'votes' && <MyVotes address={address!} />}
          {activeTab === 'tokens' && <MyTokens address={address!} />}
        </div>
      </div>
    </div>
  );
}
