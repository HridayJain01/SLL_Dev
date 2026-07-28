import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import logoStar from '@/assets/figma/logo-star.svg';
import logoWordmark from '@/assets/figma/logo-wordmark.svg';
import logoLibrary from '@/assets/figma/logo-library.svg';
import sparkle from '@/assets/figma/star-sparkle.svg';

/* Public assets — spaces are encoded so the browser resolves the URL verbatim. */
const skyBackdrop = '/background%20login.png';
const starMascot = '/slant_login_starry.png';

type AuthLayoutProps = {
  /** Big white headline on the blue panel, e.g. "Children's Book Library". */
  headline: string;
  /** Width of the headline block, matched to the Figma line breaks. */
  headlineWidth: number;
  children: ReactNode;
};

export default function AuthLayout({ headline, headlineWidth, children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header nav — 101px white band closed by a hairline, carrying only the logo */}
      <header className="relative h-[101px] shrink-0 border-b border-[rgba(102,102,102,0.25)] bg-white">
        <Link to="/" className="absolute left-6 top-[23px] block h-[56px] w-[200.6px] lg:left-[47px]">
          <img src={logoStar} alt="" className="absolute left-0 top-0 h-[56px] w-[55.7px]" />
          <img
            src={logoWordmark}
            alt="Star Learners"
            className="absolute left-[69.82px] top-[15.03px] h-[14.68px] w-[130.72px]"
          />
          <img
            src={logoLibrary}
            alt="Library"
            className="absolute left-[69.67px] top-[39.91px] h-[9.37px] w-[54.44px]"
          />
        </Link>
      </header>

      <div className="flex flex-1 lg:min-h-[972px]">
        {/* Blue hero panel — 764.5 / 1440 of the frame */}
        <div className="relative hidden shrink-0 overflow-hidden bg-[#0F9CCB] lg:block lg:w-[53.09%]">
          <img src={skyBackdrop} alt="" className="absolute inset-0 h-full w-full object-cover object-bottom" />
          <img
            src={starMascot}
            alt=""
            className="absolute bottom-[4px] left-0 h-[506px] w-[346px] object-contain object-left-bottom"
          />
          <img src={sparkle} alt="" className="absolute left-[81.92%] top-[37px] h-[64px] w-[58.125px]" />

          <div className="absolute left-0 top-[241px] flex w-full flex-col items-center">
            <h1
              className="text-center font-heading text-[64px] font-extrabold leading-[72px] tracking-[-1.44px] text-white"
              style={{ width: headlineWidth }}
            >
              {headline}
            </h1>
            <p className="mt-[4px] w-[420px] text-center font-body text-[20px] font-semibold leading-[28px] text-white">
              Books &amp; puzzles delivered
              <br />
              to your doorstep
            </p>
          </div>
        </div>

        {/* Form column — 442px wide, centred in the remaining space */}
        <div className="flex flex-1 justify-center px-6 py-[64px] lg:py-0">
          <div className="w-full max-w-[442px] lg:pt-[132px]">{children}</div>
        </div>
      </div>
    </div>
  );
}
