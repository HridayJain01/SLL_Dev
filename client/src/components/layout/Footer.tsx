import { Link } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';
import { WHATSAPP_NUMBER } from '@/lib/whatsapp';
import logoStar from '@/assets/figma/logo-star.svg';
import heroMascot from '@/assets/figma/hero-mascot.svg';

const Instagram = (p: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={p.className}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <line x1="17.5" y1="6.5" x2="17.5" y2="6.5" />
  </svg>
);

const Facebook = (p: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={p.className}>
    <path d="M22 12a10 10 0 1 0-11.5 9.9v-7H8v-2.9h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6v1.9H16l-.4 2.9h-2.1v7A10 10 0 0 0 22 12z" />
  </svg>
);

const Youtube = (p: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={p.className}>
    <path d="M23 12s0-3.2-.4-4.7a2.5 2.5 0 0 0-1.8-1.8C19.3 5 12 5 12 5s-7.3 0-8.8.5a2.5 2.5 0 0 0-1.8 1.8C1 8.8 1 12 1 12s0 3.2.4 4.7a2.5 2.5 0 0 0 1.8 1.8C4.7 19 12 19 12 19s7.3 0 8.8-.5a2.5 2.5 0 0 0 1.8-1.8C23 15.2 23 12 23 12zM9.8 15.3V8.7l5.7 3.3-5.7 3.3z" />
  </svg>
);

const COLUMNS = [
  {
    title: 'Quick links',
    links: [
      { label: 'Home', to: '/' },
      { label: 'About Us', to: '/about' },
      { label: 'How it Works', to: '/#how' },
      { label: 'Membership', to: '/membership' },
      { label: 'FAQ', to: '/faq' },
    ],
  },
  {
    title: 'Library',
    links: [
      { label: 'Browse Books', to: '/library' },
      { label: 'Browse Puzzles', to: '/library' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="overflow-hidden bg-white">
      {/* Top */}
      <div className="relative mx-auto max-w-[1280px] px-6 pt-10 pb-28">

        <div className="grid gap-12 lg:grid-cols-[1.8fr_0.8fr_0.8fr_1fr]">

          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-3">
              <img src={logoStar} alt="" className="h-12 w-12" />

              <div>
                <h3 className="font-heading text-[22px] font-black text-[#222]">
                  Star Learners
                </h3>

                <p className="text-[12px] tracking-wider text-[#666] uppercase">
                  Library
                </p>
              </div>
            </Link>

            <p className="mt-6 max-w-[260px] text-[22px] font-bold leading-9 text-[#303030]">
              India's lending library
              <br />
              for children aged
              <br />
              2 to 8.
            </p>
          </div>

          {/* Quick Links */}
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="font-heading text-[26px] font-black text-[#222]">
                {col.title}
              </h3>

              <ul className="mt-5 space-y-4">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-[18px] font-medium text-[#444] transition hover:text-[#F9732A]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact */}
          <div>
            <h3 className="font-heading text-[26px] font-black text-[#222]">
              Contact Us
            </h3>

            <div className="mt-5 space-y-4 text-[17px] text-[#444]">

              <p>
                address + location + pincode
                <br />
                phone number
              </p>

              <a
                href="mailto:info@starlearners.in"
                className="block hover:text-[#F9732A]"
              >
                info@starlearners.in
              </a>

              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                className="flex items-center gap-2 hover:text-[#F9732A]"
              >
                <Phone size={18} />
                WhatsApp
              </a>

              <a
                href="mailto:hello@starlearners.com"
                className="flex items-center gap-2 hover:text-[#F9732A]"
              >
                <Mail size={18} />
                Email
              </a>
            </div>

            <div className="mt-8 flex gap-5">
              <a href="#">
                <Facebook className="h-6 w-6 text-[#222]" />
              </a>

              <a href="#">
                <Youtube className="h-6 w-6 text-[#222]" />
              </a>

              <a href="#">
                <Instagram className="h-6 w-6 text-[#222]" />
              </a>
            </div>
          </div>
        </div>

        {/* Mascot */}

        <img
          src={heroMascot}
          alt=""
          className="absolute bottom-0 left-1/2 w-[340px] -translate-x-1/2 translate-y-20"
        />
      </div>

      {/* Bottom Bar */}

      <div className="bg-[#1599CC]">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-4 px-6 py-7 text-white md:flex-row">

          <p className="text-[15px]">
            © {new Date().getFullYear()} Star Learners. All rights reserved.
          </p>

          <div className="flex flex-wrap gap-5 text-[15px]">
            <Link to="/privacy" className="hover:underline">
              Privacy Policy
            </Link>

            <span>·</span>

            <Link to="/terms" className="hover:underline">
              Terms of Service
            </Link>

            <span>·</span>

            <Link to="/refund" className="hover:underline">
              Refund Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}