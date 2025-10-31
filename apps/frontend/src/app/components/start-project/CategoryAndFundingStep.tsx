"use client";
import React, { useState } from "react";
import { categories } from "../../constant/categories";

interface Props {
  projectData: {
    category: string;
    fundingGoal: number;
    isLoadingProjectFee: boolean;
    projectFee: bigint;
  };
  onUpdate: (data: {
    category?: string;
    fundingGoal?: number;
    projectFee?: number;
  }) => void;
}

export default function CategoryAndFundingStep({
  projectData,
  onUpdate,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="text-sm text-gray-600">
          {projectData.isLoadingProjectFee ? (
            <div className="flex items-center">
              <span className="font-medium">Project Start Cost:</span>
              <svg
                className="animate-spin h-4 w-4 ml-2 text-gray-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
          ) : (
            <span>
              <span className="font-medium">Project Start Cost:</span>{" "}
              {projectData.projectFee
                ? (Number(projectData.projectFee as bigint) / 10 ** 18).toFixed(
                    10
                  )
                : "0.00"}{" "}
              BNB
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <select
          value={projectData.category}
          onChange={(e) => onUpdate({ category: e.target.value })}
          className="form-select block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
        >
          <option value="">Select a category</option>
          {categories.map((category: { name: string; value: number }) => (
            <option key={category.value} value={category.value}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-700 mb-1">
          Funding Goal (BNB)
        </label>
        <input
          type="number"
          min="0"
          value={projectData.fundingGoal}
          onChange={(e) => onUpdate({ fundingGoal: Number(e.target.value) })}
          className="form-input block w-full rounded-lg border-gray-300 
          shadow-sm focus:border-primary focus:ring-primary"
        />
      </div>
    </div>
  );
}
