'use client';	

import { getUserCampaigns } from '../../../lib/queries/getUserCampaigns';
import CampaignCard from '../../components/projects/CampaignCard';
import Campaign  from "../../interface/Campaign";
import { useQuery } from "@tanstack/react-query";
import {  useAccount } from "wagmi";
import { ethers } from 'ethers';
import { toast } from 'react-toastify';



interface UserCampaignsData {
  campaignCreator: {
    createdCampaigns: Campaign[];
    fundingGiven: string;
    fundingWithdrawn: string;
  }
}

export default function UserProjects() {
  
  const { address } = useAccount();
 
  const { data: campaigns, error, isLoading } = useQuery<UserCampaignsData>({
    queryKey: ["userProjects", address?.toLowerCase().toString()],
    queryFn: ({ queryKey }): any => {
      const [, address] = queryKey;
      return getUserCampaigns(address as string);
    },
    enabled: !!address,
  });



 

  if (error) {
    console.error("Error fetching your campaigns:", error);
    toast.error("Error fetching your campaigns", {
      position: "top-right",
      autoClose: 5000,
    });
  }
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Campaigns</h1>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  const hasNoCampaigns = !campaigns?.campaignCreator?.createdCampaigns?.length;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Campaigns</h1>
      
      {/* Funding Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Funding Given</h3>
          <p className="text-2xl font-bold text-blue-600">
            {ethers.formatEther(campaigns?.campaignCreator?.fundingGiven ? campaigns.campaignCreator.fundingGiven : 0)} BNB
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Funding Withdrawn</h3>
          <p className="text-2xl font-bold text-green-600">
            {ethers.formatEther(campaigns?.campaignCreator?.fundingWithdrawn ? campaigns.campaignCreator.fundingWithdrawn : 0)} BNB
          </p>
        </div>
      </div>

      {hasNoCampaigns ? (
        <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-8 min-h-[200px]">
          <p className="text-xl text-gray-600 mb-4">You haven't created any campaigns yet</p>
          <a href="/start-project" className="text-blue-500 hover:text-blue-600 font-medium">
            Create your first campaign →
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns?.campaignCreator?.createdCampaigns.map((campaign: Campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  );
}
