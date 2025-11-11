'use client';

import { useQuery } from '@apollo/client/react';
import Link from 'next/link';
import { CATEGORIES } from '@/lib/constants';
import { GET_CATEGORY_COUNTS } from '@/lib/queries/landing';
import { Campaign } from '@/types/campaign';

export function CategoryShowcase() {
  const { data } = useQuery<{ campaigns: Campaign[] }>(GET_CATEGORY_COUNTS);

  // Count campaigns per category
  const categoryCounts = CATEGORIES.map((category) => {
    const count = data?.campaigns?.filter((c) => c.category === category.id).length || 0;
    return {
      ...category,
      count,
    };
  });

  return (
    <section className="py-16 md:py-20 bg-white dark:bg-gray-800">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Explore by Category
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Find projects that match your interests
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {categoryCounts.map((category) => (
            <Link
              key={category.id}
              href={`/projects?category=${category.id}`}
              className="group bg-gray-50 dark:bg-gray-900 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl p-6 text-center transition-all duration-200"
            >
              <div className="text-4xl md:text-5xl mb-3 group-hover:scale-110 transition-transform">
                {category.icon}
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                {category.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {category.count} {category.count === 1 ? 'project' : 'projects'}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
