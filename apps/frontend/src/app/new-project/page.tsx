'use client';

import { useState, useEffect } from 'react';
import CategoryAndFundingStep from '../components/start-project/CategoryAndFundingStep';
import ProjectDetailsStep from '../components/start-project/ProjectDetailsStep';
import ProjectSummaryStep from '../components/start-project/ProjectSummaryStep';
import { toast } from "react-toastify";
import { useReadContract, useWriteContract, useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import CrowdFundingFactoryABI from "../../../abis/FactoryContract.json";
const factoryContractAddress = process.env.NEXT_PUBLIC_FACTORY_ADDRESS || "0x";
import { categories } from "../constant/categories";
import Spinner from '../components/common/Spinner';
import axios from 'axios';



const steps = ['Category & Funding', 'Project Details', 'Summary & Media'];

export default function StartProject() {
  const [activeStep, setActiveStep] = useState(0);
  const router = useRouter();
  const { address } = useAccount();

  const [projectData, setProjectData] = useState({
    category: "",
    fundingGoal: 0,
    title: '',
    description: '',
    duration: 30,
    images: [] as File[],
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isWritingContract, setIsWritingContract] = useState(false);

  const { data: createFee, isLoading: isLoadingProjectFee, error: readError } = useReadContract({
    address: factoryContractAddress as `0x${string}`,
    abi: CrowdFundingFactoryABI,
    args: [],
    functionName: "getFundingFee",
  });

 
  const {
    data: hash,
    error,
    writeContract,
    isSuccess,
    isPending,
    isError,
  } = useWriteContract();

  useEffect(() => {
    if (isSuccess) {
      setIsWritingContract(false);
      toast.success(`Transaction hash: ${hash}`, {
        position: "top-right",
      });
      router.push("/user/projects");
    }
  }, [hash, isSuccess]);

  useEffect(() => {
    if (isError) {
      setIsWritingContract(false);
      console.log("Error from mutation ", error);
      toast.error(`Error creating project`, {
        position: "top-right",
      });
    }
  }, [isError]);

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleUpdateProjectData = (data: Partial<typeof projectData>) => {
    setProjectData((prev) => ({ ...prev, ...data }));
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <CategoryAndFundingStep
            projectData={{...projectData, isLoadingProjectFee: isLoadingProjectFee, 
                projectFee: createFee as bigint}}
            onUpdate={handleUpdateProjectData}
          />
        );
      case 1:
        return (
          <ProjectDetailsStep
            projectData={projectData}
            onUpdate={handleUpdateProjectData}
          />
        );
      case 2:
        return (
          <ProjectSummaryStep
            projectData={{...projectData, projectFee: createFee as bigint}}
            onUpdate={handleUpdateProjectData}
          />
        );
      default:
        return 'Unknown step';
    }
  };

 

  const handleSubmit = async () => {
    try {
      if (!address) {
        toast.error(`Please connect your wallet`, {
          position: "top-right",
        });
        return;
      }
      if (projectData.category === '' || projectData.fundingGoal === 0 || projectData.title === '' || projectData.description === '' || projectData.duration === 0 || projectData.images.length === 0) {
        toast.error(`Filled in all fields`, {
            position: "top-right",
          });
      return;
    }
    let formdata = new FormData();
    projectData.images.map((f: File) => {
        formdata.append("files", f);
    });
    const category = categories.find(c => c.value === +projectData.category);
    setIsUploading(true);
      // Calculate end timestamp (current time + duration in seconds)
    const currentTimestamp = Math.floor(Date.now() / 1000); // Current time in seconds
    const durationInSeconds = projectData.duration * 24 * 60 * 60; // Convert days to seconds
    const endTimestamp = currentTimestamp + durationInSeconds;
    
    const projectDetails = {
        title: projectData.title,
        description: projectData.description,
        category: category?.name,
        amount: projectData.fundingGoal,
        date: endTimestamp,
    }
    let fees: any = createFee as bigint
    // Convert BigInt to string and format with ethers
    const formattedFees = ethers.formatEther(fees)
    formdata.append("projectDetails", JSON.stringify(projectDetails));
    const response = await axios.post('/api/upload', formdata, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log("Response from upload", response)
    if (!response.data || typeof response.data.data !== 'string') {
      throw new Error('Invalid response format: Expected transaction ID string');
    }

    const transID = response.data.data;

    setIsWritingContract(true);
    writeContract({
        address: factoryContractAddress as any,
        abi: CrowdFundingFactoryABI,
        functionName: "createNewCrowdFundingContract",
        args: [transID, BigInt(category?.value || 0), 
            projectData.title, 
            ethers.parseEther(projectData.fundingGoal.toString()), 
            BigInt(endTimestamp)],                                              
        value: ethers.parseEther(formattedFees)
      });

    } catch (error) {
      console.error("Error creating project:", error);
      setIsWritingContract(false);
      toast.error(error instanceof Error ? error.message : 'Error creating project', {
        position: "top-right",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-3xl font-bold text-center mb-8">
          Start Your Project
        </h2>
        
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {steps.map((label, index) => (
              <div key={label} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 
                  ${activeStep >= index 
                    ? 'border-primary bg-primary text-white' 
                    : 'border-gray-300 text-gray-300'
                  }`}
                >
                  {index + 1}
                </div>
                <div className={`text-sm mx-2 ${
                  activeStep >= index ? 'text-primary' : 'text-gray-400'
                }`}>
                  {label}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 ${
                    activeStep > index ? 'bg-primary' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8">
          {getStepContent(activeStep)}
        </div>

        <div className="flex justify-between">
          <button
            disabled={activeStep === 0}
            onClick={handleBack}
            className={`px-6 py-2 rounded-lg border ${
              activeStep === 0
                ? 'border-gray-300 text-gray-300 cursor-not-allowed'
                : 'border-primary text-primary hover:bg-primary hover:text-white transition-colors'
            }`}
          >
            Back
          </button>
          <button
            disabled={(activeStep === steps.length - 1 && isUploading) || isWritingContract}
            onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
            className="px-6 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-70 flex items-center gap-2"
          >
            {(isUploading || isWritingContract) && <Spinner />}
            {isWritingContract 
              ? 'Writing to smart contract'
              : activeStep === steps.length - 1 
                ? 'Create Project' 
                : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
