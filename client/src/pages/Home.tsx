import HeroSection from '@/components/home/HeroSection';
import AboutSection from '@/components/home/AboutSection';
import HowItWorks from '@/components/home/HowItWorks';
import BrowseByAge from '@/components/home/BrowseByAge';
import FeaturedBooks from '@/components/home/FeaturedBooks';
import Testimonials from '@/components/home/Testimonials';
import PricingPlans from '@/components/home/PricingPlans';
import FaqSection from '@/components/home/FaqSection';
import CtaSection from '@/components/home/CtaSection';
import BrandMarquee from '@/components/home/BrandMarquee';

export default function Home() {
  return (
    <div className="w-full">
      <HeroSection />
      <AboutSection />
      <div id="how-it-works">
        <HowItWorks />
      </div>
      <BrowseByAge />
      <FeaturedBooks />
      <Testimonials />
      <PricingPlans />
      <FaqSection />
      <CtaSection />
      <BrandMarquee />
    </div>
  );
}
