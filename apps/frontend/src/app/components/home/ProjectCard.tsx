"use client";
import React from "react";
import Campaign from "@/app/interface/Campaign";
import { isPdf } from "@/lib/utility";
import Link from "next/link";

interface ProjectCardProps {
  campaign: Campaign;
}

export default function ProjectCard({ campaign }: ProjectCardProps) {
  console.log("campaign gghhhhhhhhhhhhhh", campaign);
    const progressPercentage = +campaign?.amountRaised / +campaign?.amountSought * 100;

  return (
    <div className="group relative bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="relative h-40">

      {campaign?.content?.media.map((mediaItem, index) => (
    <div key={index} className="h-48 min-w-full flex-shrink-0">
      {isPdf(mediaItem) ? (
        <div className="relative h-full w-full">
          <iframe
            src={`${mediaItem.split(":")[0]}#view=FitH`}
            className="absolute w-full h-full"
            title={`PDF preview for ${campaign.content.title}`}
          />
        </div>
      ) : (
        <img
          src={`https://arweave.net/${mediaItem.split(":")[0]}`}
          alt={`${campaign.content.title} - Image ${index + 1}`}
          className="w-full h-full object-contain"
          width={50}
          height={50}
        />
      )}
    </div>
  ))}
       
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {campaign?.content?.title}
        </h3>
        <div className="mb-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-1">
            <span>{(+campaign?.amountRaised / 10 ** 18) || 0.00} raised</span>
            <span>{(+campaign?.amountSought / 10 ** 18) || 0.00} goal</span>
          </div>
        </div>
        <div className="absolute inset-0 bg-indigo-600 bg-opacity-90 text-white p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <h3 className="text-lg font-semibold mb-2">{campaign?.content?.title}</h3>
            <p className="text-sm">{campaign?.content?.details}</p>
          <div className="absolute bottom-4 left-4">
            <Link href={`/user/projects/${campaign?.id}`} target="_blank" rel="noopener noreferrer">
              <button className="bg-white text-indigo-600 px-4 py-2 rounded-lg text-sm font-medium">
                Learn More
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 