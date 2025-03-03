import React from 'react';
import { truncateAddress } from '@/lib/utility'; 

interface Vote {
  voter: string;
  weight: number;
  support: boolean;
}

interface VoteDisplayProps {
  votes: Vote[];
}

const VoteDisplay: React.FC<VoteDisplayProps> = ({ votes }) => {


  // If no votes, show message
  if (!votes || votes.length === 0) {
    return (
      <div className="border rounded-lg p-4 text-center text-gray-500">
        No milestone votes to display
      </div>
    );
  }

  // Calculate total weights
  const totalSupport = votes
    .filter(vote => vote.support)
    .reduce((sum, vote) => sum + +vote.weight, 0);
    
  const totalAgainst = votes
    .filter(vote => !vote.support)
    .reduce((sum, vote) => sum + +vote.weight, 0);

  return (
    <div className="border rounded-lg p-4">
      {/* Vote Summary */}
      <div className="flex justify-between mb-4">
        <div className="text-green-600">
          <span className="font-bold">Support:</span> {totalSupport}
        </div>
        <div className="text-red-600">
          <span className="font-bold">Against:</span> {totalAgainst}
        </div>
      </div>

      {/* Votes Table */}
      <div className="max-h-[400px] overflow-y-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Voter</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Weight</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Support</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {votes.map((vote, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {truncateAddress(vote.voter)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {vote.weight}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-sm ${vote.support ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {vote.support ? 'For' : 'Against'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};




export default VoteDisplay;
