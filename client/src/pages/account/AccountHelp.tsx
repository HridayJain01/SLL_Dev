import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, MessageCircle, Package, Truck } from 'lucide-react';
import { FAQS } from '@/lib/faqs';
import { WHATSAPP_NUMBER } from '@/lib/whatsapp';
import { cn } from '@/lib/utils';
import { AccountPage, AccountPageHeader, Card, CardTitle } from '@/components/account/AccountCard';

const SUPPORT_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hi! I need help with my Star Learners Library membership."
)}`;

/**
 * Help inside the dashboard, so a member with a question doesn't get dropped
 * onto the marketing FAQ page and lose their place.
 */
export default function AccountHelp() {
  const [open, setOpen] = useState<number | null>(0);
  const reduceMotion = useReducedMotion();

  return (
    <AccountPage>
      <AccountPageHeader
        title="Help & Support"
        subtitle="Answers to the usual questions — and a way to reach a human."
      />

      {/* Shortcuts to the screens people actually want when they land here. */}
      <div className="grid gap-[16px] sm:grid-cols-3">
        {[
          {
            to: '/account/orders',
            icon: Truck,
            title: 'Track an order',
            body: 'See what is out with you and request a pickup.',
          },
          {
            to: '/account/box',
            icon: Package,
            title: 'Fix my box',
            body: 'Add, remove or swap items before checkout.',
          },
          {
            to: '/account/membership',
            icon: MessageCircle,
            title: 'Plan & billing',
            body: 'Check your quota, renew or change plan.',
          },
        ].map(({ to, icon: Icon, title, body }) => (
          <Link
            key={to}
            to={to}
            className="group rounded-[18px] border border-[#e5e7eb] bg-white p-[18px] transition-colors hover:border-lagoon-deep"
          >
            <span className="grid h-[36px] w-[36px] place-items-center rounded-full bg-chip-mint text-lagoon-darkest">
              <Icon className="h-[17px] w-[17px]" strokeWidth={1.7} />
            </span>
            <p className="pt-[12px] font-heading text-[14px] font-bold leading-[20px] text-night group-hover:text-lagoon-deep">
              {title}
            </p>
            <p className="pt-[2px] font-body text-[13px] leading-[19px] text-slate-muted">{body}</p>
          </Link>
        ))}
      </div>

      <Card>
        <CardTitle>Frequently asked</CardTitle>

        <div className="pt-[16px]">
          {FAQS.map((faq, index) => {
            const isOpen = open === index;
            return (
              <div key={faq.q} className="border-b border-[#f1f2f4] last:border-b-0">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 py-[16px] text-left font-body text-[14px] font-semibold leading-[21px] text-night transition-colors hover:text-lagoon-deep"
                >
                  {faq.q}
                  <ChevronDown
                    className={cn(
                      'h-[16px] w-[16px] shrink-0 text-slate-muted transition-transform duration-200',
                      isOpen && 'rotate-180'
                    )}
                    strokeWidth={1.8}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={
                        reduceMotion
                          ? { duration: 0 }
                          : { duration: 0.24, ease: [0.22, 1, 0.36, 1] }
                      }
                      className="overflow-hidden"
                    >
                      <p className="pb-[18px] font-body text-[14px] leading-[22px] text-slate-muted">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Still stuck?</CardTitle>
          <p className="pt-[4px] font-body text-[14px] leading-[21px] text-slate-muted">
            Message us on WhatsApp — we usually reply the same day.
          </p>
        </div>
        <a
          href={SUPPORT_LINK}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-[8px] rounded-full bg-lagoon-deep px-[21px] py-[11px] font-body text-[14px] font-semibold leading-[20px] text-white transition-colors hover:bg-lagoon-darkest"
        >
          <MessageCircle className="h-[16px] w-[16px]" strokeWidth={1.8} />
          Chat with support
        </a>
      </Card>
    </AccountPage>
  );
}
