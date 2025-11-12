import { 
  Rocket, 
  Heart, 
  Target, 
  Vote, 
  Coins, 
  Shield, 
  ChevronDown,
  CheckCircle,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-purple-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            How It Works
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
            A transparent, milestone-based crowdfunding platform powered by blockchain technology
          </p>
        </div>
      </section>

      {/* Platform Overview */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Three Simple Steps
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Whether you&apos;re a creator or a supporter, getting started is easy
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-6">
                <Rocket className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">1</span>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Create or Discover</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Creators launch campaigns with clear goals and timelines. Supporters browse and find projects that inspire them.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-6">
                <Heart className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-3xl font-bold text-green-600 dark:text-green-400">2</span>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Fund & Track</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Support campaigns with BNB donations and earn reward tokens. Track progress through transparent milestones.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mb-6">
                <Vote className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">3</span>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Vote & Decide</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Backers vote on milestone completion. Your vote weight is based on your contribution amount.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Creators */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm uppercase tracking-wide">
                For Campaign Creators
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2 mb-6">
                Launch Your Vision
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                Turn your ideas into reality with transparent, milestone-based funding. Build trust with your community through blockchain-verified progress.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      Set Your Goal
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      Define your funding target and campaign duration (1-365 days)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      Create Milestones
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      Break your project into up to 3 milestones. First withdrawal is auto-approved, others require community vote.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <Coins className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      Receive Funding
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      Withdraw 1/3 of funds per approved milestone. Build trust through transparent execution.
                    </p>
                  </div>
                </div>
              </div>

              <Link
                href="/new-project"
                className="inline-flex items-center gap-2 mt-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                <Rocket className="w-5 h-5" />
                Start a Campaign
              </Link>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Campaign Creation Fee
              </h3>
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Platform Fee</span>
                    <span className="font-bold text-gray-900 dark:text-white">0.000000001 BNB</span>
                  </div>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  ✓ Minimal fee to prevent spam
                  <br />
                  ✓ No commission on funds raised
                  <br />
                  ✓ Fully decentralized and transparent
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Donors */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 rounded-2xl p-8">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Reward Token Benefits
                </h3>
                <div className="space-y-4">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-2">
                      <Coins className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                      <span className="font-semibold text-gray-900 dark:text-white">MWG-DT Tokens</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Earn 1 token per 1 BNB donated
                    </p>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    ✓ Proof of support for campaigns
                    <br />
                    ✓ Voting power on milestones
                    <br />
                    ✓ Burned when you withdraw donations
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <span className="text-green-600 dark:text-green-400 font-semibold text-sm uppercase tracking-wide">
                For Donors & Backers
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2 mb-6">
                Support with Confidence
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                Back projects you believe in and help shape their success through community voting. Your support is protected by transparent milestones.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <Heart className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      Donate Anytime
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      Support active campaigns with any amount. Receive reward tokens instantly (1:1 with donation).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <Vote className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      Vote on Progress
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      Vote on milestone completion. Your vote weight equals your donation amount. Requires 66.67% approval.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      Withdraw Protection
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      Can withdraw donations before milestones (10% fee applies). Withdrawal amount decreases as milestones complete.
                    </p>
                  </div>
                </div>
              </div>

              <Link
                href="/projects"
                className="inline-flex items-center gap-2 mt-8 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Browse Campaigns
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Milestone System */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Milestone-Based Funding
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Funds are released in stages as creators complete milestones, ensuring transparency and accountability
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Milestone 1 */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  1
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  First Milestone
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Auto-approved upon creation. Withdraw 1/3 of total funds to begin project execution.
              </p>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Withdrawal</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">33.33%</div>
              </div>
            </div>

            {/* Milestone 2 */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border-2 border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  2
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Second Milestone
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Requires community vote. 14-day voting period. Needs 66.67% approval from backers.
              </p>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Withdrawal</div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">33.33%</div>
              </div>
            </div>

            {/* Milestone 3 */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border-2 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  3
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Final Milestone
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Final delivery. Community vote required. Withdraw remaining funds upon approval.
              </p>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Withdrawal</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">33.33%</div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Donor Protection
                </h4>
                <p className="text-gray-700 dark:text-gray-300">
                  Donors can withdraw their contributions before all milestones are approved. Withdrawal amount decreases as milestones complete (0 approved: 100%, 1 approved: 66.67%, 2 approved: 33.33%). A 10% fee applies to all withdrawals.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Everything you need to know about the platform
            </p>
          </div>

          <div className="space-y-4">
            <details className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 group">
              <summary className="flex items-center justify-between cursor-pointer">
                <span className="font-semibold text-gray-900 dark:text-white">
                  What blockchain network is this built on?
                </span>
                <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
              </summary>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                The platform is built on BSC (Binance Smart Chain) Testnet. All transactions are recorded on the blockchain, ensuring full transparency and immutability.
              </p>
            </details>

            <details className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 group">
              <summary className="flex items-center justify-between cursor-pointer">
                <span className="font-semibold text-gray-900 dark:text-white">
                  How do voting weights work?
                </span>
                <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
              </summary>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Your voting power on milestone approval is proportional to your donation amount. If you donated 1 BNB out of a total 10 BNB raised, you have 10% voting power. Milestones require 66.67% approval to pass.
              </p>
            </details>

            <details className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 group">
              <summary className="flex items-center justify-between cursor-pointer">
                <span className="font-semibold text-gray-900 dark:text-white">
                  What are MWG-DT tokens used for?
                </span>
                <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
              </summary>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                MWG-DT (Milestone Weighted Governance - Donation Token) serves as proof of your support. You receive 1 token per 1 BNB donated. These tokens give you voting rights on milestones and are burned if you withdraw your donation.
              </p>
            </details>

            <details className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 group">
              <summary className="flex items-center justify-between cursor-pointer">
                <span className="font-semibold text-gray-900 dark:text-white">
                  Can I get my money back if I change my mind?
                </span>
                <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
              </summary>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Yes, you can withdraw your donation before all 3 milestones are approved. However, a 10% fee applies, and the withdrawable amount decreases as milestones are completed (100% before any milestone, 66.67% after 1st, 33.33% after 2nd, 0% after 3rd).
              </p>
            </details>

            <details className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 group">
              <summary className="flex items-center justify-between cursor-pointer">
                <span className="font-semibold text-gray-900 dark:text-white">
                  What happens if a milestone vote fails?
                </span>
                <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
              </summary>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                If a milestone doesn&apos;t receive 66.67% approval, it&apos;s marked as &quot;Declined&quot; and the creator cannot withdraw funds for that milestone. The campaign owner can create a new milestone or end the campaign. Donors retain their withdrawal rights.
              </p>
            </details>

            <details className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 group">
              <summary className="flex items-center justify-between cursor-pointer">
                <span className="font-semibold text-gray-900 dark:text-white">
                  Where is campaign content stored?
                </span>
                <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
              </summary>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Campaign descriptions, images, and milestone details are stored on Arweave, a permanent and decentralized storage network. This ensures your content remains accessible forever and cannot be censored or removed.
              </p>
            </details>

            <details className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 group">
              <summary className="flex items-center justify-between cursor-pointer">
                <span className="font-semibold text-gray-900 dark:text-white">
                  Is there a fee for donating?
                </span>
                <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
              </summary>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                No! There are no platform fees for donations. You only pay the standard blockchain gas fees for the transaction. 100% of your donation goes directly to the campaign smart contract.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join our community of creators and supporters today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/new-project"
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8 py-4 rounded-lg transition-colors"
            >
              <Rocket className="w-5 h-5" />
              Launch a Campaign
            </Link>
            <Link
              href="/projects"
              className="inline-flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-8 py-4 rounded-lg transition-colors border-2 border-blue-400"
            >
              <Heart className="w-5 h-5" />
              Explore Projects
            </Link>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="py-12 bg-gray-100 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Still have questions?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We&apos;re here to help you get the most out of the platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://github.com/jamiebones/crowd-funding-sponsored"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              View Documentation →
            </a>
            <span className="hidden sm:inline text-gray-400">|</span>
            <a
              href="https://testnet.bscscan.com/address/0x9C413E92bf610Ccd0Cd044c3ba25876764AB8FDD"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              View Smart Contracts →
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
