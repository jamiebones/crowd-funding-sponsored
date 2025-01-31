"use client";
import React from "react";
import Image from "next/image";

interface ProjectCardProps {
  project: {
    id: number;
    title: string;
    image: string;
    raised: number;
    goal: number;
    description: string;
  };
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const progressPercentage = (project.raised / project.goal) * 100;

  return (
    <div className="group relative bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="relative h-40">
        <Image
          src={project.image}
          alt={project.title}
          fill
          className="object-cover"
          unoptimized
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {project.title}
        </h3>
        <div className="mb-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-1">
            <span>${project.raised.toLocaleString()} raised</span>
            <span>${project.goal.toLocaleString()} goal</span>
          </div>
        </div>
        <div className="absolute inset-0 bg-indigo-600 bg-opacity-90 text-white p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <h3 className="text-lg font-semibold mb-2">{project.title}</h3>
          <p className="text-sm">{project.description}</p>
          <div className="absolute bottom-4 left-4">
            <button className="bg-white text-indigo-600 px-4 py-2 rounded-lg text-sm font-medium">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 