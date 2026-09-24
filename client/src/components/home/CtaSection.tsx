import { Link } from 'react-router-dom';
import ctaPhoto from '@/assets/figma/cta-photo.webp';
import starBlack from '@/assets/figma/cta-star-black.svg';
import starWhite from '@/assets/figma/cta-star-white.svg';
import starsMobile from '@/assets/figma/cta-stars-mobile.svg';

export default function CtaSection() {
  return (
    <section className="w-full bg-[#f9f6ef] px-[17px] py-8 sm:px-6 sm:py-16 lg:px-20 lg:py-[100px]">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col sm:gap-1 lg:flex-row">
        {/* Yellow panel */}
        <div className="relative flex-1 overflow-hidden rounded-t-[16px] bg-[#fed731] px-6 pb-6 pt-4 sm:rounded-[16px] sm:py-12 lg:h-[430px] lg:px-0 lg:py-0">
          <div className="relative z-10 flex flex-col gap-3 sm:gap-7 lg:absolute lg:left-6 lg:top-1/2 lg:w-[575px] lg:-translate-y-1/2">
            <div className="flex flex-col gap-1 sm:gap-[23px]">
              <h2 className="font-heading text-[24px] font-black leading-[40px] text-[#26332d] sm:text-[52px] sm:leading-[1.05] lg:text-[64px] lg:leading-[40px]">
                Let’s Get Started!
              </h2>
              <p className="max-w-[238px] font-body text-[12px] font-semibold leading-[16px] text-[#4a5565] sm:max-w-[330px] sm:text-[20px] sm:leading-[28px]">
                Start your child’s reading journey Curated books, flexible plans, and fresh picks
                every month.
              </p>
            </div>
            <Link
              to="/signup"
              className="flex w-[110px] items-center justify-center rounded-[50px] bg-[#ef692b] px-3 py-2 font-body text-[12px] font-semibold leading-[20px] text-[#fdfdfd] transition-colors hover:bg-primary-dark sm:w-[216px] sm:py-4 sm:font-heading sm:text-[18px] sm:font-bold sm:leading-[21.6px]"
            >
              Join Now
            </Link>
          </div>

          {/* Phone: the two stars as one group, cropped by the panel edge */}
          <img
            src={starsMobile}
            alt=""
            aria-hidden
            className="pointer-events-none absolute left-[212px] top-[45px] h-[157px] w-[187.778px] sm:hidden"
          />

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
        <div className="relative h-[192px] flex-1 overflow-hidden rounded-b-[16px] bg-white sm:h-auto sm:rounded-[16px] lg:h-[430px]">
          <img loading="lazy" decoding="async"
            src={ctaPhoto}
            alt="A mother helping her son with his homework"
            className="h-full w-full object-cover lg:absolute lg:left-0 lg:top-[-12px] lg:h-[456px] lg:w-[652px] lg:max-w-none"
          />
        </div>
      </div>
    </section>
  );
}
