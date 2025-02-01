import React from 'react';

export const Loading = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="relative w-20 h-20">
        {/* Outer circle */}
        <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
        {/* Spinning circle */}
        <div className="absolute inset-0 border-4 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
      </div>
      <p className="mt-4 text-lg text-gray-600 font-medium">Loading...</p>
    </div>
  );
}; 