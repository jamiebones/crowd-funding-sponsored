"use client";
import React from "react";
import Campaign from "../../interface/Campaign";
import { isPdf } from "@/lib/utility";
import Link from "next/link";

export default function FeaturedProject({ campaign }: { campaign: Campaign }) {
  // Safeguard against null/undefined campaigns
  if (!campaign || !campaign.content) {
    return (
      <div className="lg:w-1/3">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Featured Project
        </h2>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden p-6 h-96 flex items-center justify-center">
          <div className="text-gray-500">No featured project available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:w-1/3">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Featured Project
      </h2>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="relative h-80">
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

        <div className="p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            {campaign?.content.title}
          </h3>
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-indigo-600 h-2.5 rounded-full"
                style={{
                  width: `${Math.min(
                    (+campaign.amountRaised / +campaign.amountSought) * 100,
                    100
                  )}%`,
                }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>{+campaign.amountRaised / 10 ** 18} BNB raised</span>
              <span>{+campaign.amountSought / 10 ** 18} BNB goal</span>
            </div>
          </div>
          <p className="text-gray-600 mb-4">{campaign?.content.details}</p>

          <Link
            href={`/user/projects/${campaign.id}`}
            target="_blank"
            className="block overflow-hidden rounded-lg bg-white shadow-lg hover:shadow-xl transition-shadow duration-300"
          >
            <button className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
              Support This Project
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
