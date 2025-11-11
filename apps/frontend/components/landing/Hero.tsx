import Link from 'next/link';
import { ArrowRight, TrendingUp, Users, Target } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 py-20 md:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium">
            <TrendingUp className="w-4 h-4" />
            <span>Decentralized Crowdfunding on BSC</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 dark:text-white max-w-4xl">
            Fund Innovation,{' '}
            <span className="text-blue-600 dark:text-blue-400">
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
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-lg transition-colors shadow-lg shadow-blue-600/30"
            >
              Explore Projects
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/new-project"
              className="inline-flex items-center justify-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold px-8 py-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 transition-colors"
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
        <div className="absolute left-1/2 top-0 -translate-x-1/2 blur-3xl opacity-30">
          <div className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-blue-400 to-purple-400" />
        </div>
      </div>
    </section>
  );
}
