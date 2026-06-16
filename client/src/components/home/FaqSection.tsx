import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Minus } from 'lucide-react';
import mascot from '@/assets/figma/hero-mascot.svg';

const FAQS = [
  {
    q: 'How does the borrowing work?',
    a: 'Pick books and puzzles from our library, we deliver them to your door, and you keep them for the month. When you’re ready, swap them for a fresh set.',
  },
  {
    q: 'What ages do you cater to?',
    a: 'Our collection is curated for children aged 2 to 8, sorted into age-appropriate stages so every pick is just right.',
  },
  {
    q: 'How often can I swap books?',
    a: 'It depends on your plan — from one swap a month on Starter to unlimited swaps on Premium.',
  },
  {
    q: 'Is delivery really free?',
    a: 'Yes. Every plan includes free home delivery and pickup within our serviceable areas.',
  },
  {
    q: 'What if a book gets damaged?',
    a: 'Gentle wear is completely fine — kids will be kids! We only ask you to let us know about any major damage.',
  },
];

export default function FaqSection() {
  const [open, setOpen] = useState(0);

  return (
    <section className="bg-white py-16 lg:py-24">
      <div className="mx-auto grid max-w-[1280px] items-start gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        {/* Image / illustration */}
        <div className="order-2 lg:order-1">
          <div className="flex items-center justify-center rounded-[28px] bg-chip-butter p-10">
            <img src={mascot} alt="Star Learners mascot" className="w-[280px] max-w-full" />
          </div>
        </div>

        {/* Accordion */}
        <div className="order-1 lg:order-2">
          <p className="font-body text-[18px] font-medium uppercase tracking-[2px] text-primary-light">FAQ</p>
          <h2 className="mt-3 font-heading text-[32px] font-extrabold leading-[1.1] tracking-[-1px] text-ink sm:text-[42px] lg:text-[48px]">
            Real questions, honest answers
          </h2>

          <div className="mt-8 divide-y divide-black/10 border-y border-black/10">
            {FAQS.map((item, i) => {
              const isOpen = open === i;
              return (
                <div key={item.q}>
                  <button
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    className="flex w-full items-center justify-between gap-4 py-5 text-left"
                  >
                    <span className="font-heading text-[18px] font-bold text-ink">{item.q}</span>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </span>
                  </button>
                  {isOpen && (
                    <p className="-mt-1 pb-5 pr-12 text-[16px] font-medium leading-relaxed text-text-muted">{item.a}</p>
                  )}
                </div>
              );
            })}
          </div>

          <Link to="/faq" className="mt-6 inline-block font-heading text-[16px] font-bold text-primary hover:underline">
            See all FAQs →
          </Link>
        </div>
      </div>
    </section>
  );
}
