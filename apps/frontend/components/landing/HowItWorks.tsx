import { Target, Vote, Coins, ShieldCheck, Rocket, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function HowItWorks() {
  const steps = [
    {
      icon: Rocket,
      title: 'Create Campaign',
      description: 'Launch your project with clear goals and milestones. Set your funding target and duration.',
      gradient: 'from-blue-500 to-cyan-500',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
    },
    {
      icon: Coins,
      title: 'Receive Donations',
      description: 'Backers support your campaign and earn MWG-DT tokens 1:1 with their donation amount.',
      gradient: 'from-emerald-500 to-teal-500',
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-400',
    },
    {
      icon: Target,
      title: 'Create Milestones',
      description: 'Break your project into up to 3 milestones. Submit proof of completion for each.',
      gradient: 'from-purple-500 to-pink-500',
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-400',
    },
    {
      icon: Vote,
      title: 'Community Votes',
      description: 'Donors vote on milestone completion. Requires 2/3 support to approve and release funds.',
      gradient: 'from-orange-500 to-amber-500',
      iconBg: 'bg-orange-500/20',
      iconColor: 'text-orange-400',
    },
  ];

  const features = [
    { text: 'Smart contract security', icon: ShieldCheck },
    { text: 'Transparent fund management', icon: CheckCircle2 },
    { text: 'Community-driven decisions', icon: Vote },
    { text: 'Token rewards for backers', icon: Coins },
  ];

  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Target className="w-4 h-4" />
            How It Works
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Simple, Transparent Process
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Milestone-based funding secured by smart contracts on Binance Smart Chain
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-16">
          {steps.map((step, index) => (
            <div key={index} className="relative group">
              {/* Connector line (desktop only) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[60%] w-full h-0.5 bg-gradient-to-r from-gray-300 dark:from-slate-700 to-transparent z-0" />
              )}

              {/* Card */}
              <div className="relative bg-white dark:bg-slate-800/50 rounded-3xl p-8 border border-gray-200 dark:border-slate-700 hover:border-transparent transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2 group overflow-hidden">
                {/* Hover gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${step.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                
                {/* Step number */}
                <div className={`absolute -top-3 -left-3 w-10 h-10 bg-gradient-to-br ${step.gradient} rounded-xl flex items-center justify-center text-white font-bold shadow-lg rotate-3 group-hover:rotate-0 transition-transform`}>
                  {index + 1}
                </div>

                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${step.iconBg} mb-6`}>
                  <step.icon className={`w-8 h-8 ${step.iconColor}`} />
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {step.title}
                </h3>

                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Banner */}
        <div className="relative bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 rounded-3xl p-8 md:p-12 overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f1a_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f1a_1px,transparent_1px)] bg-[size:24px_24px]" />
          
          {/* Glow effect */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/30 rounded-full blur-3xl" />
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-green-500/20 rounded-2xl">
                  <ShieldCheck className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-white">
                  Secured by Smart Contracts
                </h3>
              </div>
              <p className="text-slate-300 text-lg leading-relaxed mb-6">
                All funds are held in audited smart contracts. Donors can withdraw their contributions (with a 10% tax) before milestones are completed. Community voting ensures complete accountability.
              </p>
              
              {/* Features grid */}
              <div className="grid grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-slate-300">
                    <feature.icon className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-sm font-medium">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* CTA */}
            <div className="flex flex-col gap-4">
              <Link
                href="/projects"
                className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white font-semibold px-8 py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40"
              >
                Start Exploring
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center gap-2 text-slate-300 hover:text-white font-medium transition-colors"
              >
                Learn More
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
