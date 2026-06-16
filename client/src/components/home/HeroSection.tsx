import { Link } from 'react-router-dom';
import heroMascot from '@/assets/figma/hero-mascot.svg';
import cloud from '@/assets/figma/cloud-hero.svg';
import sparkle from '@/assets/figma/star-sparkle.svg';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-cream">
      <div className="mx-auto grid max-w-[1280px] items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:gap-6 lg:px-8 lg:py-20">
        {/* Copy */}
        <div className="relative z-10 max-w-[583px]">
          <img src={sparkle} alt="" className="absolute -left-2 -top-6 h-5 w-5 lg:-top-8" />
          <h1 className="font-heading text-[44px] font-black leading-[1.04] tracking-[-1.5px] text-ink sm:text-[56px] lg:text-[72px] lg:tracking-[-2px]">
            Books &amp; puzzles delivered to your doorstep
          </h1>
          <p className="mt-6 max-w-[470px] text-[20px] font-semibold leading-[28px] text-text-muted">
            A curated reading library for children aged 2–8. Swap books monthly, no clutter.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/library"
              className="rounded-full bg-primary px-8 py-4 font-heading text-[18px] font-bold text-white transition-transform hover:scale-105 hover:bg-primary-dark"
            >
              Browse Library
            </Link>
            <Link
              to="/membership"
              className="rounded-full border-2 border-primary px-8 py-4 font-heading text-[18px] font-bold text-ink transition-colors hover:bg-primary/5"
            >
              View Plans
            </Link>
          </div>
        </div>

        {/* Illustration */}
        <div className="relative flex justify-center lg:justify-end">
          <img
            src={cloud}
            alt=""
            className="pointer-events-none absolute -top-6 right-0 w-[260px] opacity-90 lg:w-[399px]"
          />
          <img
            src={heroMascot}
            alt="Star Learners mascot reading a book"
            className="relative z-10 w-[320px] max-w-full sm:w-[420px] lg:w-[504px]"
          />
        </div>
      </div>
    </section>
  );
}
