import { Link } from 'react-router-dom';
import mascot from '@/assets/figma/hero-mascot.svg';
import cloudMoon from '@/assets/figma/hero-cloud-moon.svg';
import sparkle from '@/assets/figma/star-sparkle.svg';
import splash from '@/assets/figma/hero-splash.svg';

export default function HeroSection() {
  return (
    <section className="relative z-10 w-full overflow-x-clip bg-[#f9f6ef]">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center px-6 pt-12 sm:px-10 lg:h-[769px] lg:flex-row lg:items-start lg:px-[144px] lg:pt-0">
        {/* Copy — 583×403 block, 134px down from the top of the hero canvas */}
        <div className="relative w-full max-w-[583px] shrink-0 lg:mt-[134px] lg:h-[403px] lg:w-[583px]">
          <img
            src={sparkle}
            alt=""
            className="pointer-events-none absolute -left-2 -top-6 h-[21px] w-[21px] lg:-left-[28px] lg:-top-[77px]"
          />
          {/* Pink splash flicking off the end of the headline */}
          <img
            src={splash}
            alt=""
            className="pointer-events-none absolute -top-4 right-2 h-[38px] w-[46px] sm:right-6 lg:-top-[18px] lg:left-[527px] lg:right-auto lg:h-[53.9px] lg:w-[65.6px]"
          />
          <h1 className="font-heading text-[44px] font-black leading-[1.04] tracking-[-1.5px] text-[#26332d] sm:text-[56px] lg:pt-[9px] lg:text-[72px] lg:leading-[75px] lg:tracking-[-2px]">
            Books &amp; puzzles delivered to your doorstep
          </h1>
          <p className="mt-6 max-w-[470px] font-body text-[20px] font-semibold leading-[28px] text-[#4a5565] lg:mt-[19px]">
            A curated reading library for children aged 2–8. Swap books monthly, no clutter.
          </p>
          <div className="mt-8 flex flex-wrap gap-[9px] lg:mt-[20px]">
            <Link
              to="/library"
              className="flex h-[56px] w-[165px] items-center justify-center rounded-[50px] bg-[#ef692b] font-heading text-[18px] font-bold leading-[21.6px] text-[#fdfdfd] transition-colors hover:bg-primary-dark"
            >
              Browse Library
            </Link>
            <Link
              to="/membership"
              className="flex h-[56px] w-[165px] items-center justify-center rounded-[50px] border-2 border-[#ef692b] font-heading text-[18px] font-bold leading-[21.6px] text-[#26332d] transition-colors hover:bg-[#ef692b]/5"
            >
              View Plans
            </Link>
          </div>
        </div>

        {/* Illustration. The mascot deliberately hangs past the bottom of the
            hero and overlaps the white section below it. */}
        <div className="relative mt-10 flex w-full justify-center lg:mt-0 lg:h-full lg:flex-1 lg:justify-start">
          <img
            src={cloudMoon}
            alt=""
            className="pointer-events-none absolute right-0 top-0 h-[110px] w-[200px] sm:h-[160px] sm:w-[290px] lg:left-[200px] lg:right-auto lg:top-[-15px] lg:h-[221px] lg:w-[399px]"
          />
          <img
            src={mascot}
            alt="Star Learners mascot reading a book"
            className="relative z-10 -mb-12 mt-14 block h-auto w-[280px] max-w-full sm:w-[360px] lg:absolute lg:left-[-6px] lg:top-[299px] lg:mb-0 lg:mt-0 lg:h-[648px] lg:w-[504px]"
          />
        </div>
      </div>
    </section>
  );
}
