'use client';

import { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { getCampaignPagination } from '@/lib/queries/getCampaignPagination';
import Campaign from '@/app/interface/Campaign';
import { Loading } from '../common/Loading';
import { ethers } from 'ethers';
import { getCampaignCategories } from '@/lib/utility';

const { NEXT_PUBLIC_ENV } = process.env;

const CampaignListComponent = () => {
  // Track pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [lastIDHistory, setLastIDHistory] = useState<string[]>(['']); // Start with empty string
  const [limit, setLimit] = useState(1);

  const { data, error, isLoading } = useQuery<{campaigns: Campaign[]}>({
    queryKey: ["campaigns", lastIDHistory[currentPage - 1], limit],
    queryFn: async () => {
      const result = await getCampaignPagination(lastIDHistory[currentPage - 1], limit as number);
      return result as {campaigns: Campaign[]};
    },
    enabled: !!limit
  });

  // Add handler for limit change
  const handleLimitChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setLimit(Number(event.target.value));
    setCurrentPage(1);
    setLastIDHistory(['']);
  };

  // Handle next page
  const handleNext = () => {
    if (data?.campaigns.length === limit) {
      const newLastID = data.campaigns[data.campaigns.length - 1].id;
      setLastIDHistory(prev => [...prev.slice(0, currentPage), newLastID]);
      setCurrentPage(prev => prev + 1);
    }
  };

  // Handle previous page
  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  if (isLoading) return <Loading />;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Campaign Contracts</h2>
        <div className="flex items-center gap-2">
          <label htmlFor="limit" className="text-sm text-gray-600">Items per page:</label>
          <select
            id="limit"
            value={limit}
            onChange={handleLimitChange}
            className="border border-gray-300 rounded-md px-2 py-1"
          >
            <option value="1">1</option>
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount Sought
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Goal
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Backers
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contract Address
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data?.campaigns.map((campaign: Campaign) => (
              <tr key={campaign.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">{campaign.content?.title?.toUpperCase()}</td>
                <td className="px-6 py-4 whitespace-nowrap">{getCampaignCategories(campaign.category)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {ethers.formatEther(campaign.amountSought)} BNB
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {ethers.formatEther(campaign.amountRaised)} BNB
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {campaign.backers ?? 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <a 
                    href={`https:${NEXT_PUBLIC_ENV === "production" ? "bscscan.com" : "testnet.bscscan.com"}/address/${campaign.contractAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {`${campaign.contractAddress.slice(0, 6)}...${campaign.contractAddress.slice(-4)}`}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-center items-center gap-4 mt-4">
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Previous
        </button>
        <span className="text-gray-600">
          Page {currentPage}
        </span>
        <button
          onClick={handleNext}
          disabled={!data || data.campaigns.length < limit}
          className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default CampaignListComponent;	