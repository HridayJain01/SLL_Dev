import HeroSection from '@/components/home/HeroSection';
import FeaturedBooks from '@/components/home/FeaturedBooks';
import CategorySection from '@/components/home/CategorySection';
import HowItWorks from '@/components/home/HowItWorks';
import Testimonials from '@/components/home/Testimonials';

export default function Home() {
  return (
    <div className="w-full">
      <HeroSection />
      <CategorySection />
      <FeaturedBooks />
      <HowItWorks />
      <Testimonials />
    </div>
  );
}
