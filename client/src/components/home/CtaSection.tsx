import { Link } from 'react-router-dom';
import sparkle from '@/assets/figma/star-sparkle.svg';
import cloud from '@/assets/figma/cloud-hero.svg';

export default function CtaSection() {
  return (
    <section className="bg-white py-12 lg:py-16">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[32px] bg-chip-butter px-8 py-12 sm:px-12 lg:px-16 lg:py-16">
          <img src={cloud} alt="" className="pointer-events-none absolute -right-6 -top-6 w-[220px] opacity-70" />
          <img src={sparkle} alt="" className="absolute left-10 top-8 h-6 w-6" />

          <div className="relative z-10 flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-[640px]">
              <h2 className="font-heading text-[34px] font-black leading-[1.05] tracking-[-1px] text-ink sm:text-[44px] lg:text-[52px]">
                Let’s Get Started!
              </h2>
              <p className="mt-4 text-[19px] font-semibold leading-[28px] text-ink/70">
                Give your child a library that grows with them. Join Star Learners today and watch the love for reading
                bloom.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-4">
              <Link
                to="/signup"
                className="rounded-full bg-primary px-8 py-4 font-heading text-[18px] font-bold text-white transition-transform hover:scale-105 hover:bg-primary-dark"
              >
                Join Now
              </Link>
              <Link
                to="/library"
                className="rounded-full border-2 border-ink/20 bg-white px-8 py-4 font-heading text-[18px] font-bold text-ink transition-colors hover:border-primary hover:text-primary"
              >
                Browse Library
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
