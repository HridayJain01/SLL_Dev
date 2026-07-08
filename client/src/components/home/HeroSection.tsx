import { Link } from 'react-router-dom';
import heroMascot from '@/assets/figma/hero-mascot.svg';

export default function HeroSection() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ backgroundColor: '#F9F6EF' }}
    >
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-16 lg:px-10 lg:py-24">
        {/* Left Content */}
        <div className="max-w-[620px]">
          <h1 className="font-heading text-[58px] font-black leading-[0.98] tracking-[-2px] text-[#25302B] lg:text-[82px]">
            Books & puzzles
            <br />
            delivered to
            <br />
            your doorstep
          </h1>

          <p className="mt-8 max-w-[430px] text-[18px] font-medium leading-7 text-[#5E6770]">
            A curated reading library for children aged 2–8.
            <br />
            Swap books monthly, no clutter.
          </p>

          <div className="mt-10 flex gap-4">
            <Link
              to="/library"
              className="rounded-full bg-[#F9732A] px-7 py-3 font-heading text-[17px] font-bold text-white transition hover:scale-105"
            >
              Browse Library
            </Link>

            <Link
              to="/membership"
              className="rounded-full border-2 border-[#F9732A] px-7 py-3 font-heading text-[17px] font-bold text-[#25302B] transition hover:bg-[#F9732A]/5"
            >
              View Plans
            </Link>
          </div>
        </div>

        {/* Right Illustration */}
        <div className="relative hidden lg:flex items-end justify-end">
          <img
            src={heroMascot}
            alt="Star Learners mascot reading a book"
            className="w-[370px] xl:w-[430px]"
          />
        </div>
      </div>
    </section>
  );
}