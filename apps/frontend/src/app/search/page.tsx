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
        <div className="max-w-3xl mx-auto mb-12">
          <div className="flex gap-4 shadow-lg rounded-lg overflow-hidden bg-white p-2">
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setStartSearch(false)
              }}
              className="flex-1 px-4 py-3 text-gray-700 focus:outline-none"
            />
            <button
              onClick={handleSearch}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg flex items-center gap-2 transition-colors duration-200"
            >
              <FiSearch className="w-5 h-5" />
              <span>Search</span>
            </button>
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
