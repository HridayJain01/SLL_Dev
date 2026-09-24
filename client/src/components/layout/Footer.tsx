import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
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
  { to: '/#faq', label: 'FAQ' },
];

const LIBRARY_LINKS = [
  { to: '/library', label: 'Browse Books' },
  { to: '/library?type=puzzle', label: 'Browse Puzzles' },
];

// Shown under "Contact Us". The phone is the WhatsApp line; an empty address is
// left out rather than printed as a placeholder.
const CONTACT = {
  address: '',
  email: 'info@starlearners.in',
  phone: WHATSAPP_NUMBER.replace(/^91(\d{5})(\d{5})$/, '+91 $1 $2'),
};

const SOCIALS = [
  { href: 'https://facebook.com', label: 'Facebook', icon: iconFacebook },
  { href: `https://wa.me/${WHATSAPP_NUMBER}`, label: 'WhatsApp', icon: iconWhatsapp },
  { href: 'https://instagram.com', label: 'Instagram', icon: iconInstagram },
];

const linkCls =
  'py-1 font-heading text-[14px] font-bold leading-[20px] text-[#26332d] transition-colors hover:text-primary lg:py-0 lg:text-[18px] lg:leading-[21.6px]';

function ColumnHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-display text-[24px] font-semibold leading-[33.6px] text-[#26332d]">
      {children}
    </p>
  );
}

function LinkList({ links }: { links: { to: string; label: string }[] }) {
  return (
    <div className="flex flex-col gap-[4px] lg:gap-[6px]">
      {links.map((l) => (
        <Link key={l.label} to={l.to} className={linkCls}>
          {l.label}
        </Link>
      ))}
    </div>
  );
}

function ContactDetails() {
  return (
    <div className="flex flex-col gap-[4px] lg:gap-4">
      {CONTACT.address && <p className={linkCls}>{CONTACT.address}</p>}
      <a href={`tel:+${WHATSAPP_NUMBER}`} className={linkCls}>
        {CONTACT.phone}
      </a>
      <a href={`mailto:${CONTACT.email}`} className={`${linkCls} break-all`}>
        {CONTACT.email}
      </a>
    </div>
  );
}

function Socials() {
  return (
    // Touch-sized hit areas on phones; the designed 24px marks and 10px gaps
    // return once there's a pointer.
    <div className="-ml-[12px] flex items-center lg:ml-0 lg:gap-[10px]">
      {SOCIALS.map((s) => (
        <a
          key={s.label}
          href={s.href}
          target="_blank"
          rel="noreferrer"
          aria-label={s.label}
          className="grid h-[40px] w-[40px] place-items-center lg:h-6 lg:w-6"
        >
          <img src={s.icon} alt="" className="h-[18px] w-[18px] lg:h-6 lg:w-6" />
        </a>
      ))}
    </div>
  );
}

/** Phone footer: each column folds into a disclosure row, as in the mobile design. */
function Fold({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group border-b border-[#d9d9d9]">
      <summary className="flex cursor-pointer list-none items-center justify-between py-[8px] font-heading text-[14px] font-extrabold leading-[1.4] text-black [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="pb-[12px] pt-[4px]">{children}</div>
    </details>
  );
}

export default function Footer() {
  return (
    <footer className="relative w-full overflow-hidden">
      <div className="relative min-h-[260px] bg-[#f9f6ef] px-[29px] pb-[40px] pt-[16px] lg:h-[458px] lg:min-h-0 lg:px-0 lg:pb-0 lg:pl-[100px] lg:pt-[60px]">
        <div className="relative z-10 flex w-full max-w-[1240px] flex-col gap-6 lg:flex-row lg:justify-between lg:gap-0">
          {/* Brand */}
          <div className="flex flex-col gap-[10px]">
            <Link to="/" className="flex items-center gap-[10px] lg:gap-[14px]">
              <img src={logoStar} alt="" className="h-[39px] w-[39px] lg:h-14 lg:w-14" />
              <span className="flex flex-col items-start">
                <img
                  src={logoWordmark}
                  alt="Star Learners"
                  className="h-[10.27px] w-[91.5px] lg:h-[14.676px] lg:w-[130.724px]"
                />
                <img
                  src={logoLibrary}
                  alt="Library"
                  className="mt-[7px] h-[6.56px] w-[38.1px] lg:mt-[10px] lg:h-[9.367px] lg:w-[54.44px]"
                />
              </span>
            </Link>
            <p className="max-w-[190px] font-heading text-[14px] font-extrabold leading-[1.4] text-[#26332d] lg:max-w-[233px] lg:text-[20px]">
              India&apos;s lending library for children aged 2 to 8.
            </p>
          </div>

          {/* Phone: folded columns on the right, clear of the mascot */}
          <div className="ml-auto flex w-[48%] min-w-[150px] flex-col gap-[4px] lg:hidden">
            <Fold title="Quick Links">
              <LinkList links={QUICK_LINKS} />
            </Fold>
            <Fold title="Library">
              <LinkList links={LIBRARY_LINKS} />
            </Fold>
            <Fold title="Contact Us">
              <ContactDetails />
            </Fold>
            <div className="pt-[12px]">
              <Socials />
            </div>
          </div>

          {/* Desktop: link columns */}
          <div className="hidden lg:flex lg:gap-[60px]">
            <div className="flex w-[145.195px] flex-col gap-4">
              <ColumnHeading>Quick links</ColumnHeading>
              <LinkList links={QUICK_LINKS} />
            </div>
            <div className="flex w-[145.195px] flex-col gap-4">
              <ColumnHeading>Library</ColumnHeading>
              <LinkList links={LIBRARY_LINKS} />
            </div>
            <div className="flex w-[330px] flex-col gap-4">
              <ColumnHeading>Contact Us</ColumnHeading>
              <ContactDetails />
              <div className="pt-[6px]">
                <Socials />
              </div>
            </div>
          </div>
        </div>

        {/* Phone mascot, hands resting on the blue bar */}
        <img
          src={footerStar}
          alt=""
          aria-hidden
          className="pointer-events-none absolute -bottom-[13px] left-0 z-20 h-[107px] w-[186px] lg:hidden"
        />
      </div>

      {/* Legal bar */}
      <div className="flex items-start justify-between gap-6 bg-[#0f9ccb] px-[38px] py-[24px] font-body text-[11px] font-normal leading-[16px] text-white lg:h-[100px] lg:px-[100px] lg:pb-[34px] lg:pt-[42px] lg:text-[18px] lg:leading-6">
        <p className="max-w-[140px] lg:max-w-none">© 2026 Star Learners. All rights reserved.</p>
        <p className="max-w-[170px] lg:max-w-none">Privacy Policy · Terms of Service · Refund Policy</p>
      </div>

      {/* Desktop mascot peeking over the blue bar — painted last so its hands
          sit on top of the legal strip. */}
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
