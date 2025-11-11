import { Target, Vote, Coins, ShieldCheck } from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      icon: Target,
      title: 'Create Campaign',
      description: 'Launch your project with clear goals and milestones. Set your funding target and duration.',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      icon: Coins,
      title: 'Receive Donations',
      description: 'Backers support your campaign and earn MWG-DT tokens 1:1 with their donation amount.',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      icon: Target,
      title: 'Create Milestones',
      description: 'Break your project into up to 3 milestones. Submit proof of completion for each milestone.',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
    {
      icon: Vote,
      title: 'Community Votes',
      description: 'Donors vote on milestone completion. Requires 2/3 support to approve and release funds.',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    },
  ];

  return (
    <section className="py-16 md:py-20 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Transparent, milestone-based funding secured by smart contracts
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connector line (desktop only) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-[60%] w-[80%] h-0.5 bg-gray-300 dark:bg-gray-700 z-0" />
              )}

              {/* Card */}
              <div className="relative bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                {/* Step number */}
                <div className="absolute -top-4 -left-4 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                  {index + 1}
                </div>

                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${step.bgColor} mb-4`}>
                  <step.icon className={`w-8 h-8 ${step.color}`} />
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {step.title}
                </h3>

                <p className="text-gray-600 dark:text-gray-300">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Trust features */}
        <div className="mt-16 bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <ShieldCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Secured by Smart Contracts
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                All funds are held in audited smart contracts on Binance Smart Chain. Donors can withdraw
                their contributions (with a 10% tax) before milestones are completed. Community voting
                ensures accountability.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
