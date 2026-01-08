'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, FileText, Download, ExternalLink } from 'lucide-react';
import Image from 'next/image';

type MediaType = 'image' | 'video' | 'document';

interface MediaGalleryProps {
  media: string[];
  categoryIcon: string;
}

// Check if URL is a video based on file extension
function isVideoUrl(url: string): boolean {
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.m4v'];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.includes(ext));
}

// Check if URL is a document based on file extension
function isDocumentUrl(url: string): boolean {
  const documentExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf', '.odt'];
  const lowerUrl = url.toLowerCase();
  return documentExtensions.some(ext => lowerUrl.includes(ext));
}

// Fetch content-type from URL to determine media type
async function detectMediaType(url: string): Promise<MediaType> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.startsWith('video/')) {
      return 'video';
    }
    
    if (
      contentType.startsWith('application/pdf') ||
      contentType.startsWith('application/msword') ||
      contentType.startsWith('application/vnd.openxmlformats') ||
      contentType.startsWith('application/vnd.ms-') ||
      contentType.startsWith('text/plain') ||
      contentType.startsWith('application/rtf') ||
      contentType.startsWith('application/vnd.oasis.opendocument')
    ) {
      return 'document';
    }
  } catch (error) {
    console.error('Error detecting media type:', error);
  }
  
  return 'image';
}

// Get document file name from URL or content-disposition
function getFileName(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const parts = pathname.split('/');
    const lastPart = parts[parts.length - 1];
    
    // If it looks like an Arweave hash (no extension), return generic name
    if (!lastPart.includes('.')) {
      return 'Document';
    }
    
    return decodeURIComponent(lastPart);
  } catch {
    return 'Document';
  }
}

export function MediaGallery({ media, categoryIcon }: MediaGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mediaTypes, setMediaTypes] = useState<Record<number, MediaType>>({});
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
      const types: Record<number, MediaType> = {};
      
      await Promise.all(
        displayMedia.map(async (url, index) => {
          // First check URL extension
          if (isVideoUrl(url)) {
            types[index] = 'video';
          } else if (isDocumentUrl(url)) {
            types[index] = 'document';
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

  // Render media item (image, video, or document)
  const renderMedia = (url: string, index: number, isThumbnail: boolean = false) => {
    const mediaType = mediaTypes[index] || 'image';

    // Video rendering
    if (mediaType === 'video') {
      if (isThumbnail) {
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

    // Document rendering
    if (mediaType === 'document') {
      const fileName = getFileName(url);
      const isPdf = url.toLowerCase().includes('.pdf') || fileName.toLowerCase().includes('.pdf');
      
      if (isThumbnail) {
        return (
          <div className="relative w-full h-full bg-gray-700 flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
        );
      }
      
      // For PDFs, show embedded viewer
      if (isPdf) {
        return (
          <div className="absolute inset-0 w-full h-full bg-gray-100 dark:bg-gray-800">
            <iframe
              src={`${url}#view=FitH`}
              className="w-full h-full"
              title={fileName}
            />
            <div className="absolute bottom-4 right-4 flex gap-2 z-10">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Open
              </a>
              <a
                href={url}
                download={fileName}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
            </div>
          </div>
        );
      }
      
      // For other documents, show download card
      return (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex flex-col items-center justify-center p-8">
          <FileText className="w-24 h-24 text-gray-400 mb-6" />
          <p className="text-white text-xl font-semibold mb-2 text-center">{fileName}</p>
          <p className="text-gray-400 text-sm mb-6">Document file</p>
          <div className="flex gap-4">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
            >
              <ExternalLink className="w-5 h-5" />
              Open in New Tab
            </a>
            <a
              href={url}
              download={fileName}
              className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Download className="w-5 h-5" />
              Download
            </a>
          </div>
        </div>
      );
    }

    // Image rendering (default)
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
