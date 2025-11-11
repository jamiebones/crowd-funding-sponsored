import { Hero } from '@/components/landing/Hero';
import { Statistics } from '@/components/landing/Statistics';
import { FeaturedCampaigns } from '@/components/landing/FeaturedCampaigns';
import { CategoryShowcase } from '@/components/landing/CategoryShowcase';
import { HowItWorks } from '@/components/landing/HowItWorks';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Statistics />
      <FeaturedCampaigns />
      <CategoryShowcase />
      <HowItWorks />
    </main>
  );
}
