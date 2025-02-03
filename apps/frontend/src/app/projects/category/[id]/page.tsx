'use client';

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCampaignsByCategory } from '@/lib/queries/getCampaignByCategory';
import { getCampaignCategories } from '@/lib/utility';
import { use } from 'react';
import { Loading } from "@/app/components/common/Loading";
import { CampaignCard } from '@/app/components/projects/CampaignCardForCategory';
import NoCampaignsCard from '@/app/components/projects/NoCampaignCard';

interface UserCampaignsData {
  campaigns: Array<{
    content: {
      media: string[];
      title: string;
      details: string;
    };
    dateCreated: string;
    contractAddress: string;
    projectDuration: number;
    backers: number;
    category: number;
    amountSought: string;
    amountRaised: string;
    id: string;
    owner: {
      id: string;
    };
  }>;
}

export default function CampaignDetails({ params }: { params: Promise<{ id: number }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();


  const { data, error, isLoading } = useQuery<UserCampaignsData>({
    queryKey: ["category", id],
    queryFn: ({ queryKey }): any => {
      const [, category] = queryKey;
      return getCampaignsByCategory(category as number);
    },
    enabled: !!id,
  });

  if (isLoading) return <Loading />;
  if (error) return <div>Error: {error.message}</div>;

  

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center text-indigo-600"> {getCampaignCategories(+id)} CATEGORY PROJECTS</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {data?.campaigns && data.campaigns.length > 0 ? (
          data.campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))
        ) : (
          <NoCampaignsCard />
        )}
      </div>
    </div>
  );



}