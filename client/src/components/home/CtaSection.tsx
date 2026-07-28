import { Link } from 'react-router-dom';
import ctaPhoto from '@/assets/figma/cta-photo.jpg';
import starBlack from '@/assets/figma/cta-star-black.svg';
import starWhite from '@/assets/figma/cta-star-white.svg';

export default function CtaSection() {
  return (
    <section className="w-full bg-[#f9f6ef] px-6 py-16 lg:px-20 lg:py-[100px]">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-1 lg:flex-row">
        {/* Yellow panel */}
        <div className="relative flex-1 overflow-hidden rounded-[16px] bg-[#fed731] px-6 py-12 lg:h-[430px] lg:px-0 lg:py-0">
          <div className="relative z-10 flex flex-col gap-7 lg:absolute lg:left-6 lg:top-1/2 lg:w-[575px] lg:-translate-y-1/2">
            <div className="flex flex-col gap-[23px]">
              <h2 className="font-heading text-[40px] font-black leading-[1.05] text-[#26332d] sm:text-[52px] lg:text-[64px] lg:leading-[40px]">
                Let’s Get Started!
              </h2>
              <p className="max-w-[330px] font-body text-[20px] font-semibold leading-[28px] text-[#4a5565]">
                Start your child’s reading journey Curated books, flexible plans, and fresh picks
                every month.
              </p>
            </div>
            <Link
              to="/signup"
              className="flex w-[216px] items-center justify-center rounded-[50px] bg-[#ef692b] px-3 py-4 font-heading text-[18px] font-bold leading-[21.6px] text-[#fdfdfd] transition-colors hover:bg-primary-dark"
            >
              Join Now
            </Link>
          </div>

          {/* Overlapping star burst */}
          <span
            className="pointer-events-none absolute hidden items-center justify-center lg:flex"
            style={{ left: 434.69, top: 132, width: 355.472, height: 355.472 }}
          >
            <img
              src={starBlack}
              alt=""
              className="block h-[277.342px] w-[277.342px] -rotate-[20deg]"
            />
          </span>
          <span
            className="pointer-events-none absolute hidden items-center justify-center lg:flex"
            style={{ left: 365, top: 226.73, width: 260.364, height: 260.364 }}
          >
            <img
              src={starWhite}
              alt=""
              className="block h-[184.483px] w-[184.483px] -rotate-[41.33deg]"
            />
          </span>
        </div>

        {/* Photo panel */}
        <div className="relative flex-1 overflow-hidden rounded-[16px] bg-white lg:h-[430px]">
          <img
            src={ctaPhoto}
            alt="A mother helping her son with his homework"
            className="h-full w-full object-cover lg:absolute lg:left-0 lg:top-[-12px] lg:h-[456px] lg:w-[652px] lg:max-w-none"
          />
        </div>
      </div>
    </section>
  );
}
