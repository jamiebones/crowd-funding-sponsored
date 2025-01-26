"use client";
import React from "react";
import Image from "next/image";
import useEmblaCarousel from 'embla-carousel-react';
import { useCallback } from 'react';
import ProjectCard from "./ProjectCard";

export default function ProjectCarousel() {
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

  const projects = [
    {
      id: 1,
      title: "EcoTrack",
      description: "Carbon footprint tracking app with ML-powered recommendations",
      image: "https://placehold.co/600x400/2563eb/ffffff?text=EcoTrack",
      raised: 1500,
      goal: 5000,
      stars: 1234,
      language: "Python",
      owner: "greentech"
    },
    {
      id: 2,
      title: "DevFlow",
      description: "Developer workflow automation toolkit with CI/CD integration",
      image: "https://placehold.co/600x400/dc2626/ffffff?text=DevFlow",
      raised: 0,
      goal: 0,
      stars: 892,
      language: "TypeScript",
      owner: "devtools-inc"
    },
    {
      id: 3,
      title: "CryptoVault",
      description: "Secure cryptocurrency wallet with multi-sig support",
      image: "https://placehold.co/600x400/059669/ffffff?text=CryptoVault",
      raised: 0,
      goal: 0,
      stars: 2156,
      language: "Rust",
      owner: "blockchain-labs"
    },
    {
      id: 4,
      title: "AIChat",
      description: "Open-source chatbot framework with custom model support",
      image: "https://placehold.co/600x400/7c3aed/ffffff?text=AIChat",
      raised: 0,
      goal: 0,
      stars: 3421,
      language: "Python",
      owner: "ai-solutions"
    },
    {
      id: 5,
      title: "CloudScale",
      description: "Kubernetes cluster auto-scaling management tool",
      image: "https://placehold.co/600x400/0284c7/ffffff?text=CloudScale",
      raised: 0,
      goal: 0,
      stars: 567,
      language: "Go",
      owner: "cloud-native"
    },
    {
      id: 6,
      title: "DataViz",
      description: "Interactive data visualization library for React",
      image: "https://placehold.co/600x400/ea580c/ffffff?text=DataViz",
      raised: 0,
      goal: 0,
      stars: 1893,
      language: "JavaScript",
      owner: "viz-tools"
    },
    {
      id: 7,
      title: "SecureAuth",
      description: "Zero-trust authentication system with biometric support",
      image: "https://placehold.co/600x400/4f46e5/ffffff?text=SecureAuth",
      raised: 0,
      goal: 0,
      stars: 945,
      language: "Java",
      owner: "security-first"
    },
    {
      id: 8,
      title: "GameEngine3D",
      description: "Cross-platform 3D game engine with WebGL support",
      image: "https://placehold.co/600x400/be185d/ffffff?text=GameEngine3D",
      raised: 0,
      goal: 0,
      stars: 2789,
      language: "C++",
      owner: "game-dev"
    },
    {
      id: 9,
      title: "IoTHub",
      description: "IoT device management and monitoring platform",
      image: "https://placehold.co/600x400/854d0e/ffffff?text=IoTHub",
      raised: 0,
      goal: 0,
      stars: 732,
      language: "JavaScript",
      owner: "iot-solutions"
    },
    {
      id: 10,
      title: "MLFlow",
      description: "Machine learning pipeline orchestration framework",
      image: "https://placehold.co/600x400/9333ea/ffffff?text=MLFlow",
      raised: 0,
      goal: 0,
      stars: 4532,
      language: "Python",
      owner: "ml-ops"
    },
    {
      id: 11,
      title: "WebAssemblyKit",
      description: "WebAssembly development toolkit and runtime",
      image: "https://placehold.co/600x400/0891b2/ffffff?text=WebAssemblyKit",
      raised: 0,
      goal: 0,
      stars: 1567,
      language: "Rust",
      owner: "wasm-dev"
    },
    {
      id: 12,
      title: "MobileUI",
      description: "Cross-platform mobile UI component library",
      image: "https://placehold.co/600x400/ca8a04/ffffff?text=MobileUI",
      raised: 0,
      goal: 0,
      stars: 892,
      language: "TypeScript",
      owner: "mobile-first"
    },
    {
      id: 13,
      title: "BlockchainDB",
      description: "Distributed database with blockchain integration",
      image: "https://placehold.co/600x400/be123c/ffffff?text=BlockchainDB",
      raised: 0,
      goal: 0,
      stars: 2341,
      language: "Go",
      owner: "blockchain-dev"
    },
    {
      id: 14,
      title: "EdgeCompute",
      description: "Edge computing framework for IoT devices",
      image: "https://placehold.co/600x400/0d9488/ffffff?text=EdgeCompute",
      raised: 0,
      goal: 0,
      stars: 678,
      language: "Rust",
      owner: "edge-solutions"
    },
    {
      id: 15,
      title: "APIForge",
      description: "API development and testing platform",
      image: "https://placehold.co/600x400/6d28d9/ffffff?text=APIForge",
      raised: 0,
      goal: 0,
      stars: 1234,
      language: "TypeScript",
      owner: "api-tools"
    },
    {
      id: 16,
      title: "QuantumSim",
      description: "Quantum computing simulation framework",
      image: "https://placehold.co/600x400/db2777/ffffff?text=QuantumSim",
      raised: 0,
      goal: 0,
      stars: 3456,
      language: "Python",
      owner: "quantum-labs"
    },
    {
      id: 17,
      title: "ARKit",
      description: "Augmented reality development toolkit",
      image: "https://placehold.co/600x400/059669/ffffff?text=ARKit",
      raised: 0,
      goal: 0,
      stars: 1789,
      language: "Swift",
      owner: "ar-dev"
    },
    {
      id: 18,
      title: "NetSecTools",
      description: "Network security analysis toolkit",
      image: "https://placehold.co/600x400/7c3aed/ffffff?text=NetSecTools",
      raised: 0,
      goal: 0,
      stars: 923,
      language: "Python",
      owner: "security-tools"
    },
    {
      id: 19,
      title: "ServerlessKit",
      description: "Serverless application development framework",
      image: "https://placehold.co/600x400/2563eb/ffffff?text=ServerlessKit",
      raised: 0,
      goal: 0,
      stars: 1567,
      language: "TypeScript",
      owner: "serverless-dev"
    },
    {
      id: 20,
      title: "DevOpsHub",
      description: "DevOps automation and monitoring platform",
      image: "https://placehold.co/600x400/dc2626/ffffff?text=DevOpsHub",
      raised: 0,
      goal: 0,
      stars: 2891,
      language: "Go",
      owner: "devops-tools"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Trending Projects</h2>
        <div className="flex gap-2">
          <button 
            onClick={scrollPrev}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <button 
            onClick={scrollNext}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-6">
          {projects.map((project) => (
            <div key={project.id} className="flex-[0_0_calc(25%-18px)] min-w-0">
              <ProjectCard project={project} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 