"use client";
import React from "react";
import Image from "next/image";

export default function FeaturedProject() {
  return (
    <div className="lg:w-1/3">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Project</h2>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="relative h-80">
          <Image
            src="https://placehold.co/800x600/indigo/white/png?text=Featured+Project"
            alt="Featured Project"
            fill
            className="object-cover"
            unoptimized
          />
        </div>
        <div className="p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Innovative Green Energy Solution
          </h3>
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: '70%' }}></div>
            </div>
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>$70,000 raised</span>
              <span>$100,000 goal</span>
            </div>
          </div>
          <p className="text-gray-600 mb-4">
            A revolutionary approach to sustainable energy production using breakthrough technology. 
            Our solution combines advanced solar capture techniques with innovative storage methods 
            to provide reliable, clean energy to communities worldwide.
          </p>
          <button className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
            Support This Project
          </button>
        </div>
      </div>
    </div>
  );
} 