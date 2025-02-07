'use client';

import { useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import { searchCampaignsByContent } from '@/lib/queries/searchCampaigns';
import Campaign from '@/app/interface/Campaign';
import { Loading } from '@/app/components/common/Loading';
import CampaignCard from '../components/projects/CampaignCard';


interface SearchCampaignsData {
  campaignSearch: {
    campaign: Campaign;
  }[];
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [startSearch, setStartSearch] = useState(false);
  const [showSearchHelp, setShowSearchHelp] = useState(false);

  const handleSearch = () => {
    setStartSearch(true);
  };


  const { data, error, isLoading } = useQuery<SearchCampaignsData>({
    queryKey: ["searchCampaignsByContent", searchQuery],
    queryFn: ({ queryKey }): any => {
      const [, searchQuery] = queryKey;
      return searchCampaignsByContent(searchQuery as string);
    },
    enabled: !!searchQuery && startSearch,
  });

  if (isLoading) {
    return <Loading />
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  console.log("data" , data);

  const campaigns = data?.campaignSearch || [];

  console.log("campaigns search" , campaigns);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-8">
          Find Campaigns
        </h1>
        
        {/* Search Section */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex flex-col gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search campaigns... (Try using operators like & | <-> :*)"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setStartSearch(false)
                  }}
                  className="w-full px-4 py-3 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
                >
                  <FiSearch className="w-5 h-5" />
                  <span>Search</span>
                </button>
              </div>
              
              <button
                onClick={() => setShowSearchHelp(!showSearchHelp)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 self-start transition-colors duration-200 bg-blue-50 px-3 py-1.5 rounded-md hover:bg-blue-100"
              >
                {showSearchHelp ? 'Hide' : 'Show'} search operators help ℹ️
              </button>

              {showSearchHelp && (
                <div className="bg-gray-50 rounded-lg p-4 mt-2">
                  <h3 className="font-semibold text-gray-700 mb-3">Search Operators Guide</h3>
                  <div className="grid gap-3 text-sm">
                    <div className="grid grid-cols-[auto,1fr] gap-4">
                      <code className="bg-gray-200 px-2 py-1 rounded">&</code>
                      <div>
                        <p className="font-medium text-gray-700">AND operator</p>
                        <p className="text-gray-600">Combines multiple search terms (e.g., "crypto & blockchain")</p>
                      </div>

                      <code className="bg-gray-200 px-2 py-1 rounded">|</code>
                      <div>
                        <p className="font-medium text-gray-700">OR operator</p>
                        <p className="text-gray-600">Matches any of the terms (e.g., "nft | crypto")</p>
                      </div>

                      <code className="bg-gray-200 px-2 py-1 rounded">&lt;-&gt;</code>
                      <div>
                        <p className="font-medium text-gray-700">FOLLOW BY operator</p>
                        <p className="text-gray-600">Specify word distance (e.g., "web &lt;-&gt; development")</p>
                      </div>

                      <code className="bg-gray-200 px-2 py-1 rounded">:*</code>
                      <div>
                        <p className="font-medium text-gray-700">PREFIX search</p>
                        <p className="text-gray-600">Matches word beginnings (e.g., "block:*" matches blockchain)</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results Section */}
        {startSearch && campaigns.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">No campaigns found</h2>
            <p className="text-gray-500">Try adjusting your search terms or try a different search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {campaigns.map(({campaign}) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
