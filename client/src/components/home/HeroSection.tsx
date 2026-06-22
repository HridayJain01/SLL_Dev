import { Link } from 'react-router-dom';
import heroMascot from '@/assets/figma/hero-mascot.svg';
import cloud from '@/assets/figma/cloud-hero.svg';
import sparkle from '@/assets/figma/star-sparkle.svg';
import pinkSplash from '@/assets/figma/hero-vector.svg';

export default function HeroSection() {
  return (
    <section className="relative z-10 overflow-x-clip bg-cream">
      <div className="mx-auto grid max-w-[1280px] items-center gap-10 px-6 pb-0 pt-12 sm:px-8 lg:grid-cols-2 lg:items-end lg:gap-12 lg:px-12 lg:pt-20">
        {/* Copy */}
        <div className="relative z-10 max-w-[583px] lg:pb-24">
          <img src={sparkle} alt="" className="absolute -left-2 -top-6 h-5 w-5 lg:-top-8" />
          {/* Pink splash flicking off the word "puzzles" */}
          <img
            src={pinkSplash}
            alt=""
            className="pointer-events-none absolute right-2 -top-4 h-8 w-10 sm:right-6 lg:right-10 lg:h-11 lg:w-14"
          />
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

        {/* Illustration — sized to the mascot so the cloud and star
            anchor relative to it, and the mascot dips into the section below. */}
        <div className="flex justify-center lg:justify-end">
          <div className="relative w-[300px] sm:w-[380px] lg:w-[460px]">
            <img
              src={cloud}
              alt=""
              className="pointer-events-none absolute -right-4 -top-2 w-[170px] opacity-95 lg:-right-8 lg:w-[280px]"
            />
            {/* Yellow star floating to the left of the mascot */}
            <img
              src={sparkle}
              alt=""
              className="pointer-events-none absolute left-0 top-[38%] h-5 w-5 lg:-left-4 lg:h-7 lg:w-7"
            />
            <img
              src={heroMascot}
              alt="Star Learners mascot reading a book"
              className="relative z-10 -mb-10 block w-full max-w-full lg:-mb-16"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
