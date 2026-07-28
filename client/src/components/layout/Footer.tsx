import { Link } from 'react-router-dom';
import { WHATSAPP_NUMBER } from '@/lib/whatsapp';
import logoStar from '@/assets/figma/logo-star.svg';
import logoWordmark from '@/assets/figma/logo-wordmark.svg';
import logoLibrary from '@/assets/figma/logo-library.svg';
import footerStar from '@/assets/figma/footer-star.svg';
import iconFacebook from '@/assets/figma/icon-facebook.svg';
import iconWhatsapp from '@/assets/figma/icon-whatsapp.svg';
import iconInstagram from '@/assets/figma/icon-instagram.svg';

const QUICK_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About Us' },
  { to: '/#how-it-works', label: 'How it Works' },
  { to: '/membership', label: 'Membership' },
  { to: '/faq', label: 'FAQ' },
];

const LIBRARY_LINKS = [
  { to: '/library', label: 'Browse Books' },
  { to: '/library?type=puzzle', label: 'Browse Puzzles' },
];

function ColumnHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-display text-[24px] font-semibold leading-[33.6px] text-[#26332d]">
      {children}
    </p>
  );
}

export default function Footer() {
  return (
    <footer className="relative w-full overflow-hidden">
      <div className="bg-[#f9f6ef] px-6 pb-16 pt-12 lg:h-[458px] lg:px-0 lg:pb-0 lg:pl-[100px] lg:pt-[60px]">
        <div className="relative z-10 flex w-full max-w-[1240px] flex-col gap-12 lg:flex-row lg:justify-between lg:gap-0">
          {/* Brand */}
          <div className="flex flex-col gap-[10px]">
            <Link to="/" className="flex items-center gap-[14px]">
              <img src={logoStar} alt="" className="h-14 w-14" />
              <span className="flex flex-col items-start">
                <img src={logoWordmark} alt="Star Learners" className="h-[14.676px] w-[130.724px]" />
                <img src={logoLibrary} alt="Library" className="mt-[10px] h-[9.367px] w-[54.44px]" />
              </span>
            </Link>
            <p className="max-w-[233px] font-heading text-[20px] font-extrabold leading-[1.4] text-[#26332d]">
              India&apos;s lending library for children aged 2 to 8
            </p>
          </div>

          {/* Link columns */}
          <div className="flex flex-col gap-10 sm:flex-row lg:gap-[60px]">
            <div className="flex flex-col gap-4 lg:w-[145.195px]">
              <ColumnHeading>Quick links</ColumnHeading>
              <div className="flex flex-col gap-[6px]">
                {QUICK_LINKS.map((l) => (
                  <Link
                    key={l.label}
                    to={l.to}
                    className="font-heading text-[18px] font-bold leading-[21.6px] text-[#26332d] transition-colors hover:text-primary"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4 lg:w-[145.195px]">
              <ColumnHeading>Library</ColumnHeading>
              <div className="flex flex-col gap-[6px]">
                {LIBRARY_LINKS.map((l) => (
                  <Link
                    key={l.label}
                    to={l.to}
                    className="font-heading text-[18px] font-bold leading-[21.6px] text-[#26332d] transition-colors hover:text-primary"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4 lg:w-[330px]">
              <ColumnHeading>Contact Us</ColumnHeading>
              <p className="font-heading text-[18px] font-bold leading-[21.6px] text-[#26332d]">
                address + location + pincode
                <br />
                phone number
              </p>
              <a
                href="mailto:info@starlearners.in"
                className="font-heading text-[18px] font-bold leading-[21.6px] text-[#26332d] transition-colors hover:text-primary"
              >
                info@ starlearners.in
              </a>
              <div className="flex items-center gap-[10px] pt-[6px]">
                <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
                  <img src={iconFacebook} alt="" className="h-6 w-6" />
                </a>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="WhatsApp"
                >
                  <img src={iconWhatsapp} alt="" className="h-6 w-6" />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
                  <img src={iconInstagram} alt="" className="h-6 w-6" />
                </a>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Legal bar */}
      <div className="flex flex-col gap-2 bg-[#0f9ccb] px-6 py-8 font-body text-[18px] font-normal leading-6 text-white sm:flex-row sm:items-start sm:justify-between lg:h-[100px] lg:px-[100px] lg:pb-[34px] lg:pt-[42px]">
        <p>© 2026 Star Learners. All rights reserved.</p>
        <p>Privacy Policy · Terms of Service · Refund Policy</p>
      </div>

      {/* Mascot peeking over the blue bar — painted last so its hands sit on
          top of the legal strip. */}
      <img
        src={footerStar}
        alt=""
        aria-hidden
        className="pointer-events-none absolute hidden h-[280px] w-[487px] lg:block"
        style={{ left: 195, top: 208 }}
      />
    </footer>
  );
}
