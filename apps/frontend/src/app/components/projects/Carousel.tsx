'use client';

import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { isPdf } from '@/lib/utility';
import { Document, Page, pdfjs } from 'react-pdf';

// Set up the PDF.js worker
// pdfjs.GlobalWorkerOptions.workerSrc = new URL(
//   'pdfjs-dist/build/pdf.worker.min.mjs',
//   import.meta.url,
// ).toString();

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export const Carousel = ({ media }: { media: string[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => setCurrentIndex((current) => (current + 1) % media.length);
  const prev = () => setCurrentIndex((current) => (current - 1 + media.length) % media.length);

  return (
    <div className="relative rounded-xl overflow-hidden bg-gray-100 aspect-video">
      <div className="absolute inset-0 flex items-center justify-center">
        {isPdf(media[currentIndex]) ? (
          <Document
            file={media[currentIndex].split(":")[0]}
            className="w-full h-full flex items-center justify-center"
          >
            <Page pageNumber={1} width={800} />
          </Document>
        ) : (
          <img
            src={`https://arweave.net/${media[currentIndex].split(":")[0]}`}
            alt={`Slide ${currentIndex + 1}`}
            className="object-contain w-full h-full"
          />
        )}
      </div>
      
      <button
        onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 hover:bg-white"
      >
        <ChevronLeftIcon className="w-6 h-6" />
      </button>
      
      <button
        onClick={next}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 hover:bg-white"
      >
        <ChevronRightIcon className="w-6 h-6" />
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {media.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full ${
              index === currentIndex ? 'bg-blue-500' : 'bg-white/60'
            }`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  );
}; 