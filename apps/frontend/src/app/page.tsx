"use client";

import useEmblaCarousel from 'embla-carousel-react';
import { useCallback } from 'react';
import FeaturedProject from "./components/home/FeaturedProject";
import RecommendedProjects from "./components/home/RecommendedProjects";
import ProjectCarousel from "./components/home/ProjectCarousel";
import Footer from "./components/Footer";
import ConnectButton from "./components/ConnectButton";
export default function Home() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    align: 'start',
    slidesToScroll: 4,
    containScroll: 'trimSnaps'
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar/Header */}
      <nav className="w-full bg-white shadow-sm px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap md:flex-nowrap items-center justify-between gap-4">
          {/* App Name/Logo */}
          <div className="text-2xl font-bold text-indigo-600">
            CrowdChain
          </div>

          {/* Search Box - will grow to take available space */}
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

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <button className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
              Start a Project
            </button>
            <ConnectButton />
          </div>
        </div>
      </nav>

      {/* Categories */}
      <div className="w-full bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <ul className="flex justify-center space-x-8">
            <li>
              <a href="#" className="text-gray-600 hover:text-indigo-600 font-medium">
                Art
              </a>
            </li>
            <li>
              <a href="#" className="text-gray-600 hover:text-indigo-600 font-medium">
                Music
              </a>
            </li>
            <li>
              <a href="#" className="text-gray-600 hover:text-indigo-600 font-medium">
                Science
              </a>
            </li>
            <li>
              <a href="#" className="text-gray-600 hover:text-indigo-600 font-medium">
                Technology
              </a>
            </li>
            <li>
              <a href="#" className="text-gray-600 hover:text-indigo-600 font-medium">
                Film
              </a>
            </li>
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
              1,234
            </div>
            <div className="text-gray-600 font-medium">
              Projects Created
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 w-64">
            <div className="text-3xl font-bold text-indigo-600 mb-2">
              $8.2M
            </div>
            <div className="text-gray-600 font-medium">
              Total Amount Raised
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 w-64">
            <div className="text-3xl font-bold text-indigo-600 mb-2">
              5,678
            </div>
            <div className="text-gray-600 font-medium">
              Total Creators
            </div>
          </div>
        </div>
      </div>

      {/* Featured and Recommended Projects Section */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-wrap justify-center gap-8">
          <FeaturedProject />
          <RecommendedProjects />
        </div>
      </div>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-4">
        <hr className="border-gray-200 my-12" />
      </div>

      {/* Carousel Section */}
      <ProjectCarousel />

      {/* Footer */}
      <Footer />
    </div>
  );
}
