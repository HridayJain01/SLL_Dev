import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

import heroMascot from '@/assets/figma/hero-mascot.svg';

const FAQS = [
  {
    question: 'How does the subscription work?',
    answer:
      "Choose a plan and receive a curated set of books every month. Once you're done, return them and get a fresh set.",
  },
  {
    question: 'Can I choose the books myself?',
    answer:
      'Yes! Depending on your membership, you can handpick books from our library or receive curated recommendations.',
  },
  {
    question: 'Can I change or upgrade my plan later?',
    answer:
      'Absolutely. You can upgrade, downgrade, or pause your membership anytime from your account.',
  },
  {
    question: 'How does the monthly exchange work?',
    answer:
      'Schedule a pickup through our website. We collect the old books and deliver the new ones in the same visit.',
  },
  {
    question: 'What if a book gets damaged?',
    answer:
      'Normal wear is expected. If a book is significantly damaged or lost, a replacement fee may apply.',
  },
];

export default function FAQ() {
  const [open, setOpen] = useState(0);

  return (
    <section
      className="py-24"
      style={{ backgroundColor: '#FFFFFF' }}
    >
      <div className="mx-auto max-w-[1280px] px-6">

        {/* Heading */}

        <h2 className="text-center font-heading text-[56px] font-black text-[#25302B]">
          Frequently Asked Questions
        </h2>

        <div className="mt-16 grid gap-8 lg:grid-cols-[1fr_430px]">

          {/* LEFT */}

          <div>

            {/* OPEN FAQ */}

            <div className="rounded-[28px] bg-[#EEF0FF] px-9 py-8">

              <button
                onClick={() => setOpen(open === 0 ? -1 : 0)}
                className="flex w-full items-start justify-between"
              >
                <h3 className="pr-6 text-left text-[26px] font-bold text-[#49556A]">
                  {FAQS[0].question}
                </h3>

                <span className="rounded-full border border-[#6D6D6D] p-1">
                  {open === 0 ? (
                    <ChevronUp size={18} />
                  ) : (
                    <ChevronDown size={18} />
                  )}
                </span>
              </button>

              {open === 0 && (
                <p className="mt-6 max-w-[520px] text-[19px] leading-9 text-[#4C596A]">
                  {FAQS[0].answer}
                </p>
              )}
            </div>

            {/* Bottom Grid */}

            <div className="mt-8 grid gap-5 md:grid-cols-2">
                            {FAQS.slice(1).map((faq, index) => {
                const actualIndex = index + 1;

                return (
                  <div
                    key={faq.question}
                    className="rounded-[24px] border border-[#E6E6E6] bg-white px-7 py-6 transition hover:shadow-sm"
                  >
                    <button
                      onClick={() =>
                        setOpen(open === actualIndex ? -1 : actualIndex)
                      }
                      className="flex w-full items-start justify-between gap-5"
                    >
                      <h3 className="text-left text-[19px] font-bold leading-7 text-[#49556A]">
                        {faq.question}
                      </h3>

                      <span className="mt-1 shrink-0 rounded-full border border-[#7D7D7D] p-1">
                        {open === actualIndex ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </span>
                    </button>

                    {open === actualIndex && (
                      <p className="mt-5 text-[16px] leading-8 text-[#667085]">
                        {faq.answer}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT SIDE */}

          <div className="relative flex items-center justify-center">

            {/* Background Circle */}

            <div className="absolute h-[340px] w-[340px] rounded-full bg-[#FFF5CF]" />

            {/* Mascot */}

            <img
              src={heroMascot}
              alt="Star Learners Mascot"
              className="relative z-10 w-[320px]"
            />

            {/* Decorative Stars */}

            <div className="absolute left-5 top-10 text-3xl">⭐</div>

            <div className="absolute right-8 top-24 text-2xl">✨</div>

            <div className="absolute bottom-12 left-12 text-2xl">⭐</div>

            <div className="absolute bottom-20 right-12 text-3xl">✨</div>
          </div>

        </div>
      </div>
    </section>
  );
}