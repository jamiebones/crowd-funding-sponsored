'use client';

import Link from 'next/link';
import { ArrowRight, TrendingUp, Users, Target, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

export function Hero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 py-20 md:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className={`flex flex-col items-center text-center space-y-8 transition-all duration-1000 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm border border-blue-200/50 dark:border-blue-700/50 shadow-lg shadow-blue-500/10 animate-pulse">
            <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
            <span>Decentralized Crowdfunding on BSC</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 dark:text-white max-w-4xl">
            Fund Innovation,{' '}
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent animate-gradient">
              Earn Rewards
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-2xl">
            Launch campaigns with milestone-based funding. Support projects and earn tokens. Let the community decide success.
          </p>

          {/* Features */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-8 text-sm md:text-base">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <Target className="w-5 h-5 text-blue-600" />
              <span>Milestone-Based</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <Users className="w-5 h-5 text-blue-600" />
              <span>Community Voting</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span>Token Rewards</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link
              href="/projects"
              className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-xl transition-all shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 hover:scale-105 transform"
            >
              Explore Projects
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/new-project"
              className="group inline-flex items-center justify-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 text-gray-900 dark:text-white font-semibold px-8 py-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 transition-all hover:border-blue-300 dark:hover:border-blue-600 hover:scale-105 transform shadow-lg"
            >
              Start a Campaign
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="pt-8 text-sm text-gray-500 dark:text-gray-400">
            Secured by smart contracts on Binance Smart Chain
          </div>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 blur-3xl opacity-30 animate-blob">
          <div className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-blue-400 via-purple-400 to-pink-400" />
        </div>
        <div className="absolute right-0 top-1/3 blur-3xl opacity-20 animate-blob animation-delay-2000">
          <div className="aspect-square w-[40rem] bg-gradient-to-br from-purple-400 to-pink-400" />
        </div>
        <div className="absolute left-0 bottom-0 blur-3xl opacity-20 animate-blob animation-delay-4000">
          <div className="aspect-square w-[40rem] bg-gradient-to-tr from-blue-400 to-cyan-400" />
        </div>
      </div>
    </section>
  );
}
