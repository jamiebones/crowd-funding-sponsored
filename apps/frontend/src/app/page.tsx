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

  console.log("trending projects", trendingProjects);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Commented out navigation
      <nav className="w-full bg-white shadow-sm px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap md:flex-nowrap items-center justify-between gap-4">
          <div className="text-2xl font-bold text-indigo-600">
            CrowdChain
          </div>

          <div className="order-3 md:order-none w-full md:w-auto flex-grow md:mx-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Search projects..."
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <span className="absolute right-3 top-2.5 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/new-project">
              <button className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
                Start a Project
              </button>
            </Link>
            <ConnectButton />
          </div>
        </div>
      </nav>
      */}

      {/* Categories */}
      <div className="w-full bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <ul className="flex justify-center space-x-8">
            {categories.map((category) => (
              <li key={category.value}>
                <a href={`/projects/category/${category.value}`} className="text-gray-600 hover:text-indigo-600 font-medium">
                  {category.name}
                </a>
              </li>
            ))}
          </ul>
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
              {totalFundingRequest || 0} BNB
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
          <RecommendedProjects />
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
