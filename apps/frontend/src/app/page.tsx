"use client";

import useEmblaCarousel from 'embla-carousel-react';
import { useCallback } from 'react';
import FeaturedProject from "./components/home/FeaturedProject";
import RecommendedProjects from "./components/home/RecommendedProjects";
import ProjectCarousel from "./components/home/ProjectCarousel";
import Footer from "./components/Footer";
import ConnectButton from "./components/ConnectButton";
import { useQuery } from '@tanstack/react-query';
import { getStats } from '@/lib/queries/getStats';
import Link from 'next/link';

import { categories } from "./constant/categories";
import { getAllCampaigns } from '@/lib/queries/getAllCampaigns';
import Campaign from './interface/Campaign';
import { Loading } from './components/common/Loading';
import { trendingCampaigns } from '@/lib/utility';
import { RecommendationService } from '@/lib/services/recommendationService';
import { ethers } from 'ethers';


interface StatsData {
  statistics: {
    totalContracts: number;
    totalFundingRequest: number;
    totalBackers: number;
    totalWithdrawals: number;
  }[];
}

interface AllCampaigns {
  campaigns: Campaign[];
}

export default function Home() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    align: 'start',
    slidesToScroll: 4,
    containScroll: 'trimSnaps'
  });

  const { data, error, isLoading } = useQuery<StatsData>({
    queryKey: ["stats"],
    queryFn: ({ queryKey }): any => {
      const [] = queryKey;
      return getStats();
    }
  });

  const { totalContracts, totalFundingRequest, totalBackers, totalWithdrawals } = data?.statistics[0] || {};

  const { data: allCampaigns, error: allCampaignsError, isLoading: allCampaignsLoading } = useQuery<AllCampaigns>({
    queryKey: ["allCampaigns"],
    queryFn: ({ queryKey }): any => {
      const [] = queryKey;
      return getAllCampaigns();
    }
  });

  let campaigns = allCampaigns?.campaigns || [];

  if (allCampaignsError) {
    return <div>Error fetching campaigns: {allCampaignsError.message}</div>
  }

 
  let featuredCampaign = Math.floor(Math.random() * campaigns?.length);

  let trendingProjects = trendingCampaigns(campaigns);
  let recommendedCampaigns: Campaign[] = [];
  if (campaigns.length > 0) {
    recommendedCampaigns = RecommendationService.getRecommendations(campaigns[featuredCampaign], campaigns);
    console.log("recommended campaigns", recommendedCampaigns);
  }



  console.log("trending projects", trendingProjects);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <div className="min-h-screen bg-gray-50">
    
      {/* Categories */}
      <div className="w-full bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <ul className="flex justify-center space-x-8">
            {categories.map((category) => (
              <li key={category.value}>
                <Link 
                  href={`/projects/category/${category.value}`} 
                  className="text-gray-600 hover:text-indigo-600 font-medium"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Description Section */}
      <div className="bg-gradient-to-b from-white to-gray-50 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Welcome to CrowdFunding DApp
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            Our decentralized crowdfunding platform empowers creators and innovators to bring their ideas to life. 
            Built on blockchain technology, we provide a transparent, secure, and efficient way to fund projects. 
            Whether you're an entrepreneur, artist, or innovator, connect with a community of backers who believe 
            in your vision and want to support your journey.
          </p>
        </div>
      </div>

      {/* Hero Section with Stats */}
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-12">
          Get funding for your project
        </h1>
        
        {/* Statistics Grid */}
        <div className="flex flex-wrap justify-center gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 w-64">
            <div className="text-3xl font-bold text-indigo-600 mb-2">
              {totalContracts || 0}
            </div>
            <div className="text-gray-600 font-medium">
              Projects Created
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 w-64">
            <div className="text-3xl font-bold text-indigo-600 mb-2">
              {totalFundingRequest ? ethers.formatEther(totalFundingRequest) : 0} BNB
            </div>
            <div className="text-gray-600 font-medium">
              Total Amount Raised
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 w-64">
            <div className="text-3xl font-bold text-indigo-600 mb-2">
              {totalBackers || 0}
            </div>
            <div className="text-gray-600 font-medium">
              Total Backers
            </div>
          </div>
        </div>
      </div>

      {/* Featured and Recommended Projects Section */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-wrap justify-center gap-8">

          {allCampaignsLoading ? (
            <Loading />
          ) : (
            <FeaturedProject campaign={campaigns[featuredCampaign]} />
          )}
          <RecommendedProjects campaigns={recommendedCampaigns} />
        </div>
      </div>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-4">
        <hr className="border-gray-200 my-12" />
      </div>

      {/* Carousel Section */}
      {allCampaignsLoading ? (
        <Loading />
      ) : (
        trendingProjects.length > 0 && (
          <ProjectCarousel campaigns={trendingProjects || []} />
        )
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
