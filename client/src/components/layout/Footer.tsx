import { Link } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';
import { WHATSAPP_NUMBER } from '@/lib/whatsapp';
import logoStar from '@/assets/figma/logo-star.svg';

const Instagram = (p: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}>
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <line x1="17.5" y1="6.5" x2="17.5" y2="6.5" />
  </svg>
);
const Facebook = (p: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={p.className}>
    <path d="M22 12a10 10 0 1 0-11.5 9.9v-7H8v-2.9h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.300000000000001c-1.2 0-1.6.8-1.6 1.6v1.9H16l-.4 2.9h-2.1v7A10 10 0 0 0 22 12z" />
  </svg>
);
const Youtube = (p: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={p.className}>
    <path d="M23 12s0-3.2-.4-4.7a2.5 2.5 0 0 0-1.8-1.8C19.3 5 12 5 12 5s-7.3 0-8.8.5a2.5 2.5 0 0 0-1.8 1.8C1 8.8 1 12 1 12s0 3.2.4 4.7a2.5 2.5 0 0 0 1.8 1.8C4.7 19 12 19 12 19s7.3 0 8.8-.5a2.5 2.5 0 0 0 1.8-1.8C23 15.2 23 12 23 12zM9.8 15.3V8.7l5.7 3.3-5.7 3.3z" />
  </svg>
);

const COLUMNS = [
  {
    title: 'Explore',
    links: [
      { label: 'Home', to: '/' },
      { label: 'Library', to: '/library' },
      { label: 'Membership', to: '/membership' },
      { label: 'About Us', to: '/about' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'FAQ', to: '/faq' },
      { label: 'Contact', to: '/about' },
      { label: 'Terms of Service', to: '/faq' },
      { label: 'Privacy Policy', to: '/faq' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-cream">
      <div className="mx-auto max-w-[1280px] px-4 pt-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 pb-12 lg:grid-cols-[1.4fr_repeat(3,0.8fr)]">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-3">
              <img src={logoStar} alt="" className="h-11 w-11" />
              <span className="font-heading text-[22px] font-extrabold text-ink">Star Learners</span>
            </Link>
            <p className="mt-4 max-w-sm text-[16px] font-medium leading-relaxed text-text-muted">
              A curated reading library delivered to your doorstep. Books and puzzles that grow with your child — minus
              the clutter.
            </p>
            <div className="mt-5 flex gap-3">
              {[Instagram, Facebook, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink transition-colors hover:bg-primary hover:text-white"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="font-heading text-[16px] font-extrabold text-ink">{col.title}</h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-[15px] font-medium text-text-muted transition-colors hover:text-primary">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact */}
          <div>
            <h3 className="font-heading text-[16px] font-extrabold text-ink">Get in touch</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  className="flex items-center gap-2 text-[15px] font-medium text-text-muted transition-colors hover:text-primary"
                >
                  <Phone className="h-4 w-4" /> WhatsApp us
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@starlearners.com"
                  className="flex items-center gap-2 text-[15px] font-medium text-text-muted transition-colors hover:text-primary"
                >
                  <Mail className="h-4 w-4" /> hello@starlearners.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Oversized wordmark */}
        <div className="relative overflow-hidden">
          <p className="select-none text-center font-display font-bold leading-none tracking-tight text-ink/90 [font-size:clamp(56px,14vw,200px)]">
            Star Learners
          </p>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-navy">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-2 px-4 py-5 text-sm text-white/80 sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Star Learners Library. All rights reserved.</p>
          <p>Made with ❤️ for little readers</p>
        </div>
      </div>
    </footer>
  );
}
