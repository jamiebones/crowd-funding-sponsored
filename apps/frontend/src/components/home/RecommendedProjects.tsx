"use client";
import React, { useState } from "react";
import Image from "next/image";
import ProjectCard from "./ProjectCard";

export default function RecommendedProjects() {
  const [currentPage, setCurrentPage] = useState(0);
  
  const projects = [
    {
      id: 1,
      title: "AI-Powered Education",
      image: "https://placehold.co/400x300/indigo/white/png?text=AI+Education",
      raised: 45000,
      goal: 100000,
      description: "Revolutionizing education through AI-powered personalized learning experiences"
    },
    {
      id: 2,
      title: "Clean Energy Initiative",
      image: "https://placehold.co/400x300/green/white/png?text=Clean+Energy",
      raised: 75000,
      goal: 150000,
      description: "Developing sustainable energy solutions for communities"
    },
    {
      id: 3,
      title: "Ocean Cleanup Tech",
      image: "https://placehold.co/400x300/blue/white/png?text=Ocean+Cleanup",
      raised: 28000,
      goal: 80000,
      description: "Innovative technology for cleaning ocean pollution"
    },
    {
      id: 4,
      title: "Urban Farming Project",
      image: "https://placehold.co/400x300/brown/white/png?text=Urban+Farming",
      raised: 15000,
      goal: 50000,
      description: "Creating sustainable urban farming solutions"
    },
    {
      id: 5,
      title: "Renewable Water Solutions",
      image: "https://placehold.co/400x300/cyan/white/png?text=Water+Solutions",
      raised: 42000,
      goal: 120000,
      description: "Innovative water purification and conservation technologies"
    },
    {
      id: 6,
      title: "Wildlife Conservation",
      image: "https://placehold.co/400x300/orange/white/png?text=Wildlife",
      raised: 55000,
      goal: 95000,
      description: "Protecting endangered species through technology and conservation"
    },
    {
      id: 7,
      title: "Digital Literacy Program",
      image: "https://placehold.co/400x300/red/white/png?text=Digital+Literacy",
      raised: 25000,
      goal: 60000,
      description: "Bridging the digital divide in underserved communities"
    },
    {
      id: 8,
      title: "Food Waste Reduction",
      image: "https://placehold.co/400x300/yellow/white/png?text=Food+Waste",
      raised: 38000,
      goal: 85000,
      description: "Smart solutions for reducing food waste in supply chains"
    },
    {
      id: 9,
      title: "Affordable Housing Tech",
      image: "https://placehold.co/400x300/gray/white/png?text=Housing+Tech",
      raised: 82000,
      goal: 200000,
      description: "Innovative construction technology for affordable housing"
    },
    {
      id: 10,
      title: "Healthcare Access Platform",
      image: "https://placehold.co/400x300/pink/white/png?text=Healthcare",
      raised: 95000,
      goal: 180000,
      description: "Expanding healthcare access through telemedicine"
    },
    {
      id: 11,
      title: "Disability Support Tools",
      image: "https://placehold.co/400x300/teal/white/png?text=Support+Tools",
      raised: 48000,
      goal: 110000,
      description: "Assistive technologies for people with disabilities"
    },
    {
      id: 12,
      title: "Youth Employment Initiative",
      image: "https://placehold.co/400x300/lime/white/png?text=Youth+Employment",
      raised: 32000,
      goal: 75000,
      description: "Creating job opportunities through skills training"
    },
    {
      id: 13,
      title: "Smart Agriculture",
      image: "https://placehold.co/400x300/olive/white/png?text=Smart+Agriculture",
      raised: 68000,
      goal: 140000,
      description: "AI-powered solutions for sustainable farming"
    },
    {
      id: 14,
      title: "Elder Care Innovation",
      image: "https://placehold.co/400x300/maroon/white/png?text=Elder+Care",
      raised: 52000,
      goal: 120000,
      description: "Technology solutions for aging population support"
    },
    {
      id: 15,
      title: "Plastic Recycling Tech",
      image: "https://placehold.co/400x300/navy/white/png?text=Recycling+Tech",
      raised: 43000,
      goal: 100000,
      description: "Advanced plastic recycling and upcycling solutions"
    },
    {
      id: 16,
      title: "Women in STEM",
      image: "https://placehold.co/400x300/purple/white/png?text=Women+In+STEM",
      raised: 58000,
      goal: 130000,
      description: "Empowering women in science and technology fields"
    },
    {
      id: 17,
      title: "Air Quality Monitoring",
      image: "https://placehold.co/400x300/slate/white/png?text=Air+Quality",
      raised: 29000,
      goal: 70000,
      description: "Smart air quality monitoring and improvement systems"
    },
    {
      id: 18,
      title: "Financial Inclusion",
      image: "https://placehold.co/400x300/gold/white/png?text=Financial+Access",
      raised: 62000,
      goal: 150000,
      description: "Making financial services accessible to underserved populations"
    },
    {
      id: 19,
      title: "Disaster Response Tech",
      image: "https://placehold.co/400x300/red/white/png?text=Disaster+Response",
      raised: 88000,
      goal: 160000,
      description: "Technology solutions for natural disaster response and recovery"
    },
    {
      id: 20,
      title: "Mental Health Platform",
      image: "https://placehold.co/400x300/purple/white/png?text=Mental+Health",
      raised: 35000,
      goal: 90000,
      description: "Digital platform for mental health support and resources"
    },
  ];

  const projectsPerPage = 4;
  const totalPages = Math.ceil(projects.length / projectsPerPage);
  
  const getCurrentProjects = () => {
    const start = currentPage * projectsPerPage;
    const end = start + projectsPerPage;
    return projects.slice(start, end);
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  return (
    <div className="lg:w-1/2">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Recommended Projects</h2>
        <div className="flex gap-2 items-center">
          <button 
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
            onClick={handlePrevPage}
            disabled={currentPage === 0}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <div className="flex gap-1">
            {[...Array(3)].map((_, idx) => {
              const pageNum = currentPage + idx - 1;
              if (pageNum >= 0 && pageNum < totalPages) {
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg ${
                      currentPage === pageNum
                        ? 'bg-gray-800 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {pageNum + 1}
                  </button>
                );
              }
              return null;
            })}
          </div>
          <button 
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
            onClick={handleNextPage}
            disabled={currentPage === totalPages - 1}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {getCurrentProjects().map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
} 