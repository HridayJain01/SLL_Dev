import { useState } from 'react';
import { Link } from 'react-router-dom';
import iconCheck from '@/assets/figma/icon-check.svg';
import iconCross from '@/assets/figma/icon-cross.svg';

const BILLING = ['Monthly', '3 Months', '6 Months', 'Yearly'] as const;
type Billing = (typeof BILLING)[number];

interface Feature {
  label: string;
  included: boolean;
}

interface Plan {
  name: string;
  blurb: string;
  price: string;
  featured: boolean;
  features: Feature[];
}

const PLANS: Plan[] = [
  {
    name: 'Little Reader',
    blurb: 'A gentle start to the reading habit',
    price: '450/mo',
    featured: false,
    features: [
      { label: '5 books per month', included: true },
      { label: 'Pick from 400+ titles', included: true },
      { label: 'Age-based catalogue access', included: true },
      { label: 'Free doorstep delivery', included: true },
      { label: 'Monthly swap', included: true },
      { label: 'WhatsApp support', included: true },
      { label: 'Puzzles', included: false },
    ],
  },
  {
    name: 'Star Reader',
    blurb: 'The sweet spot for curious kids',
    price: '720/mo',
    featured: true,
    features: [
      { label: '8 books or puzzles', included: true },
      { label: 'Pick from 400+ titles', included: true },
      { label: 'Age-based catalogue access', included: true },
      { label: 'Free doorstep delivery', included: true },
      { label: 'Monthly swap', included: true },
      { label: 'WhatsApp support', included: true },
    ],
  },
  {
    name: 'Wonder Bundle',
    blurb: 'For the child who wants it all',
    price: '950/mo',
    featured: false,
    features: [
      { label: '6 books per month', included: true },
      { label: '4 puzzles per month', included: true },
      { label: 'Pick from 400+ titles', included: true },
      { label: 'Age-based catalogue access', included: true },
      { label: 'Free doorstep delivery', included: true },
      { label: 'Monthly swap', included: true },
      { label: 'WhatsApp support', included: true },
    ],
  },
];

export default function PricingPlans() {
  const [billing, setBilling] = useState<Billing>('Monthly');

  return (
    <section className="w-full bg-[#faf7f0] py-16 lg:py-0 lg:pb-[114px] lg:pt-[44px]">
      <div className="mx-auto w-full max-w-[1218px] px-6 lg:px-0">
        {/* Heading */}
        <div className="flex flex-col items-center gap-3 text-center lg:pt-[30px]">
          <p className="font-body text-[18px] font-medium uppercase leading-[32.4px] tracking-[2px] text-[#fe753b]">
            Pricing &amp; Plan
          </p>
          <h2 className="font-heading text-[36px] font-extrabold leading-[1.1] tracking-[-1.44px] text-[#26332d] sm:text-[48px] lg:text-[64px] lg:leading-[57.6px]">
            Choose a plan that grows
            <br className="hidden lg:inline" />{' '}
            with your child
          </h2>
        </div>

        {/* Billing period switch */}
        <div className="mt-10 flex justify-center lg:mt-[59px]">
          {/* Four periods don't fit one row on a small phone, so they sit 2×2
              until there is room for the single-row pill. */}
          <div className="grid w-full max-w-[300px] grid-cols-2 gap-1 rounded-[28px] border-[1.5px] border-[#f0ede8] bg-white px-[7.5px] pb-[7.5px] pt-[7.5px] shadow-[0px_2px_8px_rgba(0,0,0,0.07)] sm:flex sm:w-auto sm:max-w-none sm:rounded-[999px] sm:pb-[1.5px]">
            {BILLING.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBilling(b)}
                className={`h-[35.391px] rounded-[999px] px-3 text-[14px] leading-[21px] tracking-[-0.1504px] transition-colors sm:px-4 ${
                  billing === b
                    ? 'bg-[#ef692b] font-bold text-white'
                    : 'font-medium text-[#6b7280] hover:text-[#26332d]'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Plans */}
        <div className="relative mt-10 grid grid-cols-1 gap-6 lg:mt-[54px] lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col items-center rounded-[16px] bg-white px-6 pb-8 pt-[27.67px] lg:h-[596px] lg:px-0 lg:pb-0 ${
                plan.featured ? 'border-2 border-[#ef692b]' : ''
              }`}
            >
              {plan.featured && (
                <span className="absolute -top-[13px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[999px] border border-[#fea121] bg-white px-4 py-1 font-body text-[11.52px] font-extrabold uppercase leading-[17.28px] tracking-[0.7236px] text-black drop-shadow-[0px_4px_6px_rgba(212,98,58,0.3)]">
                  Most Popular
                </span>
              )}

              <p className="font-heading text-[24px] font-bold leading-7 text-[#0a0a0a]">
                {plan.name}
              </p>
              <p className="mt-[6.65px] font-body text-[16px] font-medium leading-[26px] text-[#303030]">
                {plan.blurb}
              </p>
              <p className="mt-[22.68px] font-body text-[48px] font-bold leading-[60px] tracking-[-2px] text-[#0f172a]">
                {plan.price}
              </p>

              <Link
                to="/membership"
                className={`mt-[24px] flex w-full items-center justify-center rounded-[50px] px-3 py-4 font-heading text-[18px] font-bold leading-[21.6px] transition-colors lg:w-[271px] ${
                  plan.featured
                    ? 'bg-[#ef692b] text-[#fdfdfd] hover:bg-primary-dark'
                    : 'border border-[#ef692b] text-[#1a1a1a] hover:bg-[#ef692b]/5'
                }`}
              >
                Join Now
              </Link>

              <ul className="mt-[35px] flex w-full flex-col gap-3 lg:w-[319px]">
                {plan.features.map((f) => (
                  <li key={f.label} className="flex items-start gap-[9px]">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center pt-1">
                      <img
                        src={f.included ? iconCheck : iconCross}
                        alt=""
                        className={f.included ? 'h-[10.33px] w-[13.67px]' : 'h-3 w-3'}
                      />
                    </span>
                    <span
                      className={`font-body text-[16px] font-normal leading-[26px] ${
                        f.included ? 'text-[#0f172a]' : 'text-[#9ea4b2]'
                      }`}
                    >
                      {f.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
