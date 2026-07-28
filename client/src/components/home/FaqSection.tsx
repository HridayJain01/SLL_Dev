import { useState } from 'react';
import faqBooks from '@/assets/figma/faq-books.jpg';
import swoosh from '@/assets/figma/faq-swoosh.svg';

const FAQS = [
  {
    q: 'How does the subscription work?',
    a: 'Pick a plan, choose your books and puzzles from the library, and we deliver them to your door. Swap them for a fresh set whenever your child is ready.',
  },
  {
    q: 'Can I change or upgrade my plan later?',
    a: 'Yes. You can move up or down a plan at any time from your account, and the change applies from your next delivery.',
  },
  {
    q: 'Can I choose the books myself?',
    a: 'Absolutely. Browse the full catalogue and handpick every title, or let us curate an age-appropriate set for you.',
  },
  {
    q: 'Are the books clean and hygienic?',
    a: 'Every book is inspected and sanitised between borrowers, and anything worn out is retired from the library.',
  },
  {
    q: 'How does the monthly exchange work?',
    a: 'When your child has finished their books just message us on WhatsApp.\nWe will arrange a pickup and deliver a brand new set within 2 to 3 days.\nNo fixed dates, no deadlines. Exchange whenever your child is ready.',
  },
];

/* The toggle is a 24px ring with a plus that loses its vertical bar when open. */
function Toggle({ open }: { open: boolean }) {
  return (
    <span className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#002b51]">
      <span className="absolute h-[0.58px] w-[8.1px] bg-[#002b51]" />
      <span
        className={`absolute h-[8.1px] w-[0.58px] bg-[#002b51] transition-opacity ${
          open ? 'opacity-0' : 'opacity-100'
        }`}
      />
    </span>
  );
}

export default function FaqSection() {
  const [open, setOpen] = useState(FAQS.length - 1);

  return (
    <section className="relative w-full overflow-x-clip bg-white py-16 lg:h-[974px] lg:py-0">
      <div className="mx-auto w-full max-w-[1360px] px-6 lg:px-0 lg:pt-[60px]">
        {/* Heading */}
        <div className="relative mx-auto text-center lg:w-[724px]">
          <p className="font-['Plus_Jakarta_Sans'] text-[18px] font-medium uppercase leading-[32.4px] tracking-[2px] text-[#fe753b]">
            FAQ’s
          </p>
          {/* The headline runs wider than its 724px column instead of wrapping. */}
          <h2 className="mt-3 font-heading text-[36px] font-extrabold leading-[1.1] tracking-[-1.44px] text-[#26332d] sm:text-[48px] lg:whitespace-nowrap lg:text-[64px] lg:leading-[57.6px]">
            Real questions, honest answers
          </h2>
          <img
            src={swoosh}
            alt=""
            aria-hidden
            className="pointer-events-none absolute hidden h-[53.892px] w-[65.618px] lg:block"
            style={{ left: 804, top: 19 }}
          />
        </div>

        <div className="mt-12 flex flex-col gap-10 lg:mt-[69.7px] lg:flex-row lg:items-start lg:gap-[27.2px] lg:pl-[39px]">
          {/* Photo */}
          <img
            src={faqBooks}
            alt="A stack of children's picture books"
            className="w-full shrink-0 rounded-[8px] object-cover lg:h-[554.617px] lg:w-[580.797px] lg:rounded-none"
          />

          {/* Accordion — rides 60px higher than the photo, as on the canvas */}
          <div className="w-full lg:-mt-[60.8px] lg:w-[672px]">
            {FAQS.map((item, i) => {
              const isOpen = open === i;
              return (
                <div key={item.q} className="border-b border-[#9eccf5]">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    aria-expanded={isOpen}
                    className="flex w-full items-start gap-6 py-[44px] text-left"
                  >
                    <Toggle open={isOpen} />
                    <span className="font-display text-[24px] font-semibold leading-[33.6px] text-[#002b51]">
                      {item.q}
                    </span>
                  </button>
                  {isOpen && (
                    <p className="whitespace-pre-line pb-[44px] pl-12 font-body text-[16px] font-normal leading-[1.4] text-[#1a1a1a]">
                      {item.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
