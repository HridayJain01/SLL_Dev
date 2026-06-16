import HeroSection from '@/components/home/HeroSection';
import StatsSection from '@/components/home/StatsSection';
import HowItWorks from '@/components/home/HowItWorks';
import BrowseByAge from '@/components/home/BrowseByAge';
import FeaturedBooks from '@/components/home/FeaturedBooks';
import Testimonials from '@/components/home/Testimonials';
import PricingPlans from '@/components/home/PricingPlans';
import FaqSection from '@/components/home/FaqSection';
import CtaSection from '@/components/home/CtaSection';

export default function Home() {
  return (
    <div className="w-full">
      <HeroSection />
      <StatsSection />
      <HowItWorks />
      <BrowseByAge />
      <FeaturedBooks />
      <Testimonials />
      <PricingPlans />
      <FaqSection />
      <CtaSection />
    </div>
  );
}
