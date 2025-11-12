'use client';

import Link from 'next/link';
import { Home, Search, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <main 
      className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4"
      role="main"
      aria-labelledby="not-found-title"
    >
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <h1 
            id="not-found-title"
            className="text-9xl font-bold text-gray-200 dark:text-gray-700 mb-4"
            aria-label="Error 404"
          >
            404
          </h1>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Page Not Found
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors min-w-[140px]"
            aria-label="Go back to previous page"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            Go Back
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors min-w-[140px]"
            aria-label="Go to home page"
          >
            <Home className="w-5 h-5" aria-hidden="true" />
            Home
          </Link>

          <Link
            href="/projects"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors min-w-[140px]"
            aria-label="Browse all campaigns"
          >
            <Search className="w-5 h-5" aria-hidden="true" />
            Browse Campaigns
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Popular Pages
          </h3>
          <nav aria-label="Popular pages navigation">
            <ul className="space-y-2 text-left">
              <li>
                <Link
                  href="/projects"
                  className="text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
                >
                  Explore Campaigns
                </Link>
              </li>
              <li>
                <Link
                  href="/new-project"
                  className="text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
                >
                  Create Campaign
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
                >
                  About
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </main>
  );
}
