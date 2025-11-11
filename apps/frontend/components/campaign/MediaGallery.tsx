'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';

interface MediaGalleryProps {
  media: string[];
  categoryIcon: string;
}

export function MediaGallery({ media, categoryIcon }: MediaGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const hasMedia = media && media.length > 0;
  const displayMedia = hasMedia ? media : [];

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? displayMedia.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === displayMedia.length - 1 ? 0 : prev + 1));
  };

  if (!hasMedia) {
    // Fallback: Show gradient with category icon
    return (
      <div className="relative w-full h-[400px] md:h-[500px] bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
        <div className="text-9xl opacity-80">{categoryIcon}</div>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Main Image */}
      <div className="relative w-full h-[400px] md:h-[500px] bg-gray-900 rounded-xl overflow-hidden">
        <Image
          src={displayMedia[currentIndex]}
          alt={`Campaign media ${currentIndex + 1}`}
          fill
          className="object-cover"
          priority={currentIndex === 0}
        />

        {/* Navigation Arrows */}
        {displayMedia.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Counter */}
        {displayMedia.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium">
            {currentIndex + 1} / {displayMedia.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {displayMedia.length > 1 && (
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          {displayMedia.map((item, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? 'border-blue-600 scale-105'
                  : 'border-gray-300 dark:border-gray-600 opacity-60 hover:opacity-100'
              }`}
            >
              <Image
                src={item}
                alt={`Thumbnail ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
