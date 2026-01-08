'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import Image from 'next/image';

interface MediaGalleryProps {
  media: string[];
  categoryIcon: string;
}

// Check if URL is a video based on content type or file extension
function isVideoUrl(url: string): boolean {
  // Check common video extensions
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.m4v'];
  const lowerUrl = url.toLowerCase();
  
  // Check if URL ends with video extension
  if (videoExtensions.some(ext => lowerUrl.includes(ext))) {
    return true;
  }
  
  return false;
}

// Fetch content-type from URL to determine media type
async function detectMediaType(url: string): Promise<'image' | 'video'> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.startsWith('video/')) {
      return 'video';
    }
  } catch (error) {
    console.error('Error detecting media type:', error);
  }
  
  return 'image';
}

export function MediaGallery({ media, categoryIcon }: MediaGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mediaTypes, setMediaTypes] = useState<Record<number, 'image' | 'video'>>({});
  const [isDetecting, setIsDetecting] = useState(true);

  const hasMedia = media && media.length > 0;
  const displayMedia = hasMedia ? media : [];

  // Detect media types on mount
  useEffect(() => {
    if (!hasMedia) {
      setIsDetecting(false);
      return;
    }

    const detectAllTypes = async () => {
      const types: Record<number, 'image' | 'video'> = {};
      
      await Promise.all(
        displayMedia.map(async (url, index) => {
          // First check URL extension
          if (isVideoUrl(url)) {
            types[index] = 'video';
          } else {
            // Fetch content-type for Arweave URLs
            types[index] = await detectMediaType(url);
          }
        })
      );
      
      setMediaTypes(types);
      setIsDetecting(false);
    };

    detectAllTypes();
  }, [media, hasMedia, displayMedia]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? displayMedia.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === displayMedia.length - 1 ? 0 : prev + 1));
  };

  // Fallback: if image fails to load, try as video
  const handleImageError = (index: number) => {
    setMediaTypes(prev => ({ ...prev, [index]: 'video' }));
  };

  // Render media item (image or video)
  const renderMedia = (url: string, index: number, isThumbnail: boolean = false) => {
    const isVideo = mediaTypes[index] === 'video';

    if (isVideo) {
      if (isThumbnail) {
        // For thumbnails, show a play icon overlay
        return (
          <div className="relative w-full h-full bg-gray-800 flex items-center justify-center">
            <Play className="w-6 h-6 text-white" />
          </div>
        );
      }
      
      return (
        <video
          src={url}
          controls
          className="absolute inset-0 w-full h-full object-contain bg-black"
          playsInline
          preload="metadata"
        >
          Your browser does not support the video tag.
        </video>
      );
    }

    return (
      <Image
        src={url}
        alt={isThumbnail ? `Thumbnail ${index + 1}` : `Campaign media ${index + 1}`}
        fill
        className="object-cover"
        priority={!isThumbnail && index === 0}
        onError={() => handleImageError(index)}
      />
    );
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
      {/* Main Media */}
      <div className="relative w-full h-[400px] md:h-[500px] bg-gray-900 rounded-xl overflow-hidden">
        {renderMedia(displayMedia[currentIndex], currentIndex)}

        {/* Navigation Arrows */}
        {displayMedia.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-10"
              aria-label="Previous media"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-10"
              aria-label="Next media"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Counter */}
        {displayMedia.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium z-10">
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
              {renderMedia(item, index, true)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
