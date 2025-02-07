'use client';
import { Carousel } from '../../../components/projects/Carousel';
import { MilestoneSection } from '../../../components/projects/MilestoneSection';
import { DonorsSection } from '../../../components/projects/DonorsSection';
import { WithdrawalsSection } from '../../../components/projects/WithdrawalsSection';
import { getCampaignDetails } from '@/lib/queries/getCampaignDetails';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Campaign from '@/app/interface/Campaign';
import { Loading } from '@/app/components/common/Loading';
import { ethers } from 'ethers';
import { useWriteContract, useAccount } from "wagmi";
import { useState, useEffect, use } from 'react';
import { CreateMilestoneForm } from '@/app/components/projects/CreateMilestoneForm';
import { Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';
import CrowdFundingFactoryABI from "../../../../../abis/CrowdFundingContract.json";



interface UserCampaignsData {
      campaign: Campaign;
    
}
export default function CampaignDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { address } = useAccount();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();


  const { data, error, isLoading } = useQuery<UserCampaignsData>({
    queryKey: ["projectDetails", id],
    queryFn: ({ queryKey }): any => {
      const [, campaignId] = queryKey;
      return getCampaignDetails(campaignId as string);
    },
    enabled: !!id,
  });

  const campaign = data?.campaign;

  console.log("campaign ", campaign)

  const {
    data: hash,
    error: errorCreateMilestone,
    writeContract,
    isSuccess,
    isPending,
    isError,
  } = useWriteContract();

  useEffect(() => {
    if (isError) {
      console.log("Error from mutation ", errorCreateMilestone);
      setIsModalOpen(false);
      toast.error(`Error sending transaction: ${errorCreateMilestone?.message}`, {
        position: "top-right",
      });
    }
  }, [isError, errorCreateMilestone]);

  useEffect(() => {
    if (isSuccess) {
      setIsModalOpen(false);
      toast.success(`Milestone created successfully: Transaction hash: ${hash}`, {
        position: "top-right",
      });
      queryClient.invalidateQueries({ queryKey: ["projectDetails", id] });
    }
  }, [isSuccess, hash, id]);


  const handleCreateMilestone = async (data: any) => {
    if (!address) {
      return toast.error(`Connect your wallet`, {
        position: "top-right",
      });
    }
    try {
      console.log("data ", data)
      setUploading(true);
      const conData = `
        Milestone Title: ${data.title} 
        Milestone Details ${data.details.substring(0, 150)}
      `;
      const milestoneDetails = {
        title: data.title,
        description: data.details,
        category: "",
        amount: "",
        date: ""
      }
      if (!confirm(conData)) return;
      const formdata = new FormData();
      data.media.map((file: any) => {
        formdata.append("files", file.file);
      });
      formdata.append("projectDetails", JSON.stringify(milestoneDetails));
      const response = await axios.post('/api/upload', formdata, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setUploading(false);
      if (!response.data || typeof response.data.data !== 'string') {
        throw new Error('Invalid response format: Expected transaction ID string');
      }
      const transID = response.data.data;
        writeContract({
          address: campaign?.contractAddress as any,
          abi: CrowdFundingFactoryABI,
          functionName: "createNewMilestone",
          args: [transID],
        });
    } catch (error) {
      console.log("Error sending transaction ", error);
      toast.error("Error sending transaction", {
        position: "top-right",
      });
    } 
  };



  if (isLoading) return <Loading />;

  if (error) return <div className="flex justify-center p-8 text-red-500">Error: {error.message}</div>;

 

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">{campaign?.content.title}</h1>
          <div className="flex flex-wrap gap-6">
            <div className="flex-1 min-w-[300px]">
              <Carousel media={campaign?.content.media || []} />
            </div>
            <div className="flex-1 min-w-[300px] space-y-4">
              <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-6">
                <div className="grid grid-cols-2 gap-4">
                  <StatsCard title="Amount Sought" value={`${ethers.formatEther(campaign?.amountSought.toString() || 0.0)} BNB`} />
                  <StatsCard title="Amount Raised" value={`${ethers.formatEther(campaign?.amountRaised.toString() || 0.0)} BNB`} />
                  <StatsCard title="Backers" value={campaign?.backers || 0} />
                  <StatsCard title="Status" value={campaign?.campaignRunning ? 'Active' : 'Ended'} />
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <h4 className="text-xl font-semibold">Project Duration</h4>
                  <p className="text-gray-600">{new Date(+campaign?.projectDuration! * 1000).toLocaleDateString()}</p>
                </div>
                
                <div className="flex items-center justify-between border-b pb-3">
                  <h4 className="text-xl font-semibold">Owner</h4>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-600 truncate max-w-[250px]" title={campaign?.owner?.id}>
                      {campaign?.owner?.id}
                    </p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(campaign?.owner?.id || '');
                        toast.success('Address copied to clipboard!');
                      }}
                      className="p-1 hover:bg-gray-100 rounded-full"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <h4 className="text-xl font-semibold">Contract</h4>
                  <a 
                    href={`https://${process.env.NEXT_PUBLIC_ENV === 'testnet' ? 'testnet.' : '' }bscscan.com/address/${campaign?.contractAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:text-purple-800 truncate max-w-[250px] hover:underline"
                    title={campaign?.contractAddress}
                  >
                    {campaign?.contractAddress}
                  </a>
                </div>
              </div>
              <div className="bg-white rounded-xl pl-6">
                <h4 className="text-xl font-semibold mb-3">Campaign Details</h4>
                <p className="text-gray-600">{campaign?.content.details}</p>
              </div>
            </div>
          </div>
        </div>

         {/* Donors Section */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <DonorsSection donations={campaign?.donations || []} 
           contractAddress={campaign?.contractAddress as string} id={id} 
           withdrawals={campaign?.donorsRecall || []} />
          <WithdrawalsSection withdrawals={campaign?.donorsRecall || []} />
        </div>

        {/* Milestone Section */}
        <MilestoneSection milestones={campaign?.milestone || []} 
          currentMilestone={campaign?.currentMilestone || ''} 
          donations={campaign?.donations || []} 
          withdrawals={campaign?.donorsRecall || []} 
          contractAddress={campaign?.contractAddress as string}
          projectDuration={+campaign?.projectDuration! || 0}
          owner={campaign?.owner?.id || ''}
        />

      { address?.toLowerCase() === campaign?.owner?.id?.toLowerCase() && (
        <div className="group relative">
          <button
            onClick={() => setIsModalOpen(true)}
            className="fixed bottom-8 right-8 bg-purple-600 text-white rounded-full p-4 shadow-lg hover:bg-purple-700"
            aria-label="Create new milestone"
          >
            <Plus size={24} />
          </button>
          <div className="fixed bottom-[5.5rem] right-8 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200">
            <div className="bg-gray-800 text-white text-sm py-1 px-2 rounded shadow-lg whitespace-nowrap">
              Create new milestone
            </div>
          </div>
        </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4 md:mx-auto">
              <h2 className="text-3xl font-bold mb-8">Create New Milestone</h2>
              <CreateMilestoneForm
                onSubmit={handleCreateMilestone}
                onCancel={() => setIsModalOpen(false)}
                isPending={isPending}
                isUploading={uploading}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const StatsCard = ({ title, value }: { title: string; value: string | number }) => (
  <div className="bg-white/80 rounded-lg p-4">
    <h3 className="text-sm font-medium text-gray-500">{title}</h3>
    <p className="text-2xl font-bold text-gray-800">{value}</p>
  </div>
);

