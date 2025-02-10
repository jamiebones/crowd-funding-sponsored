'use client';

import { useState } from 'react';
import { PieChart } from 'react-minimal-pie-chart';

// Dummy data for categories
const categoryData = [
  { title: 'Health', value: 39, color: '#FF6384' },
  { title: 'Education', value: 25, color: '#36A2EB' },
  { title: 'Technology', value: 18, color: '#FFCE56' },
  { title: 'Environment', value: 15, color: '#4BC0C0' },
  { title: 'Arts', value: 12, color: '#9966FF' },
];

// Dummy data for campaigns
const campaignData = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  name: `Campaign ${i + 1}`,
  goal: Math.floor(Math.random() * 100000) + 10000,
  balance: Math.floor(Math.random() * 50000),
  category: categoryData[Math.floor(Math.random() * categoryData.length)].title,
}));





// Campaign List Component
const CampaignListComponent = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(campaignData.length / itemsPerPage);

  const paginatedData = campaignData
    .sort((a, b) => b.goal - a.goal)
    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Campaign Contracts</h2>
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
                Goal
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Balance
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((campaign) => (
              <tr key={campaign.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">{campaign.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{campaign.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  ${campaign.goal.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  ${campaign.balance.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-center items-center gap-4 mt-4">
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Previous
        </button>
        <span className="text-gray-600">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default CampaignListComponent;	