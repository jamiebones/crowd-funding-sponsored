'use client';

import { useQuery } from '@apollo/client/react';
import Link from 'next/link';
import { CATEGORIES } from '@/lib/constants';
import { GET_CATEGORY_COUNTS } from '@/lib/queries/landing';
import { Campaign } from '@/types/campaign';
import { ArrowRight, Sparkles } from 'lucide-react';

// Gradient colors for each category
const categoryGradients: { [key: number]: string } = {
  0: 'from-blue-500 to-cyan-500',      // Technology
  1: 'from-pink-500 to-rose-500',      // Arts
  2: 'from-green-500 to-emerald-500',  // Community
  3: 'from-yellow-500 to-orange-500',  // Education
  4: 'from-emerald-500 to-teal-500',   // Environment
  5: 'from-red-500 to-pink-500',       // Health
  6: 'from-purple-500 to-indigo-500',  // Social
  7: 'from-orange-500 to-amber-500',   // Charity
  8: 'from-slate-500 to-zinc-500',     // Other
};

export function CategoryShowcase() {
  const { data } = useQuery<{ campaigns: Campaign[] }>(GET_CATEGORY_COUNTS);

  // Count campaigns per category
  const categoryCounts = CATEGORIES.map((category) => {
    const count = data?.campaigns?.filter((c) => c.category === category.id).length || 0;
    return {
      ...category,
      count,
      gradient: categoryGradients[category.id],
    };
  });

  return (
    <section className="py-20 md:py-28 bg-white dark:bg-slate-950">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              Categories
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Explore by Category
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl">
              Find projects that match your interests and make a meaningful impact
            </p>
          </div>
          <Link
            href="/projects"
            className="group inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold"
          >
            View All Projects
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5">
          {categoryCounts.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.name.toLowerCase()}`}
              className="group relative bg-gray-50 dark:bg-slate-900 rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/10 border border-gray-200 dark:border-slate-800 hover:border-transparent overflow-hidden"
            >
              {/* Hover gradient background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              
              {/* Content */}
              <div className="relative z-10">
                <div className="text-5xl md:text-6xl mb-4 group-hover:scale-110 transition-transform duration-300 group-hover:drop-shadow-lg">
                  {category.icon}
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-white mb-2 transition-colors">
                  {category.name}
                </h3>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-white/80 transition-colors font-medium">
                    {category.count} {category.count === 1 ? 'project' : 'projects'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
