"use client";

import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useState, useEffect } from "react";
import FeaturedProject from "./components/home/FeaturedProject";
import RecommendedProjects from "./components/home/RecommendedProjects";
import ProjectCarousel from "./components/home/ProjectCarousel";
import Footer from "./components/Footer";
import ConnectButton from "./components/ConnectButton";
import { useQuery } from "@tanstack/react-query";
import { getStats } from "@/lib/queries/getStats";
import Link from "next/link";

import { categories } from "./constant/categories";
import { getAllCampaigns } from "@/lib/queries/getAllCampaigns";
import Campaign from "./interface/Campaign";
import { Loading } from "./components/common/Loading";
import { trendingCampaigns } from "@/lib/utility";
import { RecommendationService } from "@/lib/services/recommendationService";
import { ethers } from "ethers";

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
  // All hooks must be at the top, before any conditional logic
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    slidesToScroll: 4,
    containScroll: "trimSnaps",
  });

  // Client-only randomization to avoid SSR hydration mismatch
  const [featuredCampaign, setFeaturedCampaign] = useState<number | null>(null);
  const [isClient, setIsClient] = useState(false);

  const { data, error, isLoading } = useQuery<StatsData>({
    queryKey: ["stats"],
    queryFn: ({ queryKey }): any => {
      const [] = queryKey;
      return getStats();
    },
  });

  const {
    data: allCampaigns,
    error: allCampaignsError,
    isLoading: allCampaignsLoading,
  } = useQuery<AllCampaigns>({
    queryKey: ["allCampaigns"],
    queryFn: ({ queryKey }): any => {
      const [] = queryKey;
      return getAllCampaigns();
    },
  });

  useEffect(() => {
    setIsClient(true);
    const campaigns = allCampaigns?.campaigns || [];
    if (campaigns.length > 0) {
      setFeaturedCampaign(Math.floor(Math.random() * campaigns.length));
    }
  }, [allCampaigns?.campaigns]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  // Now we can handle conditional rendering and early returns
  const {
    totalContracts,
    totalFundingRequest,
    totalBackers,
    totalWithdrawals,
  } = data?.statistics[0] || {};
  let campaigns = allCampaigns?.campaigns || [];

  if (allCampaignsError) {
    console.error("Error fetching campaigns:", allCampaignsError);
    // Instead of showing error, show the app with fallback data
    campaigns = []; // Use empty array as fallback
  }

  let trendingProjects = trendingCampaigns(campaigns);
  let recommendedCampaigns: Campaign[] = [];
  if (
    campaigns.length > 0 &&
    featuredCampaign !== null &&
    campaigns[featuredCampaign] &&
    campaigns[featuredCampaign].content
  ) {
    recommendedCampaigns = RecommendationService.getRecommendations(
      campaigns[featuredCampaign],
      campaigns
    );
    console.log("recommended campaigns", recommendedCampaigns);
  }

  console.log("trending projects", trendingProjects);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
      {/* Error Notification */}
      {allCampaignsError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mx-6 mt-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Note:</strong> Campaign data is currently unavailable.
                The subgraph service may be temporarily down or needs
                redeployment.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="w-full bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-center space-x-6">
          <ul className="flex space-x-6">
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
      <div className="py-16 flex items-center justify-center">
        <div className="max-w-3xl mx-auto px-8 py-10 bg-white/80 backdrop-blur-sm rounded-xl shadow-xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Welcome to CrowdFunding DApp
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            Our decentralized crowdfunding platform empowers creators and
            innovators to bring their ideas to life. Built on blockchain
            technology, we provide a transparent, secure, and efficient way to
            fund projects. Whether you're an entrepreneur, artist, or innovator,
            connect with a community of backers who believe in your vision and
            want to support your journey.
          </p>
        </div>
      </div>

      {/* Hero Section with Stats */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-12">
          Get funding for your project
        </h1>

        {/* Statistics Grid */}
        <div className="flex flex-wrap justify-center gap-8">
          <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-lg w-64 hover:shadow-2xl transition-shadow">
            <div className="text-3xl font-bold text-indigo-600 mb-2">
              {totalContracts || 0}
            </div>
            <div className="text-gray-600 font-medium">Projects Created</div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-lg w-64 hover:shadow-2xl transition-shadow">
            <div className="text-3xl font-bold text-indigo-600 mb-2">
              {totalFundingRequest
                ? ethers.formatEther(totalFundingRequest)
                : 0}{" "}
              BNB
            </div>
            <div className="text-gray-600 font-medium">Total Amount Raised</div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-lg w-64 hover:shadow-2xl transition-shadow">
            <div className="text-3xl font-bold text-indigo-600 mb-2">
              {totalBackers || 0}
            </div>
            <div className="text-gray-600 font-medium">Total Backers</div>
          </div>
        </div>
      </div>

      {/* Featured and Recommended Projects Section */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-wrap justify-center gap-8">
          {allCampaignsLoading ? (
            <Loading />
          ) : isClient &&
            featuredCampaign !== null &&
            campaigns[featuredCampaign] ? (
            <FeaturedProject campaign={campaigns[featuredCampaign]} />
          ) : (
            <div className="lg:w-1/3">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Featured Project
              </h2>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden p-6 h-96 flex items-center justify-center">
                <div className="text-gray-500">Loading featured project...</div>
              </div>
            </div>
          )}
          <RecommendedProjects campaigns={recommendedCampaigns} />
        </div>
      </div>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-6">
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
