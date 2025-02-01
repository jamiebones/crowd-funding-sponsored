'use client';

import { formatDistance, subDays } from 'date-fns';
import { ethers } from 'ethers';
import Campaign from "../../interface/Campaign";
import { isPdf, getCampaignCategories } from "@/lib/utility";
import { useRouter } from "next/navigation";


interface CampaignCardProps {
  campaign: Campaign;
}

export default function CampaignCard({ campaign }: CampaignCardProps) {
  const progress = (Number(campaign.amountRaised) / Number(campaign.amountSought)) * 100;
  console.log("campaign.endDate", campaign.projectDuration);
  const timeLeft = formatDistance(subDays(new Date(+campaign.projectDuration * 1000), 1), new Date(), { addSuffix: true });
  const router = useRouter();


 const navigateToDetails = (projectID: string) => {
    router.push(`/user/projects/${projectID}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="relative h-48 overflow-x-auto flex" onClick={() => navigateToDetails(campaign.id)} 
      style={{ cursor: 'pointer' }}>
        {campaign.content.media.map((mediaItem, index) => (
          <div key={index} className="h-48 min-w-full flex-shrink-0">
            {isPdf(mediaItem) ? (
              <div className="relative h-full w-full">
                <iframe
                  src={`${mediaItem.split(":")[0]}#view=FitH`}
                  className="absolute w-full h-full"
                  title={`PDF preview for ${campaign.content.title}`}
                />
              </div>
            ) : (
              <img
                src={`https://arweave.net/${mediaItem.split(":")[0]}`}
                alt={`${campaign.content.title} - Image ${index + 1}`}
                className="w-full h-full object-contain"
                width={100}
                height={100}
              />
            )}
          </div>
        ))}
      </div>
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-2 line-clamp-1">
          {campaign.content.title}
        </h2>
        <p className="text-gray-600 mb-4 text-sm line-clamp-2">
          {campaign.content.details}
        </p>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
          <div
            className="bg-blue-600 h-2.5 rounded-full"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        
        <div className="flex justify-between text-sm mb-4">
          <span className="text-gray-600">
            {ethers.formatEther(campaign.amountRaised)} BNB raised
          </span>
          <span className="text-gray-600">
            {Math.round(progress)}%
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">
            {timeLeft}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs ${
            campaign.campaignRunning ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {campaign.campaignRunning ? 'Active' : 'Ended'}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
            {getCampaignCategories(campaign.category)}
          </span>
        </div>
      </div>
    </div>
  );
} 