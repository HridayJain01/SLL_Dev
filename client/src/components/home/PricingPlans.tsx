import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';

const PLANS = [
  {
    name: 'Starter',
    price: '499',
    tagline: 'For first-time borrowers',
    features: ['2 books at a time', '1 swap per month', 'Free home delivery', 'Age-based picks'],
    popular: false,
  },
  {
    name: 'Family',
    price: '799',
    tagline: 'Our most popular plan',
    features: ['4 books at a time', '2 swaps per month', 'Free priority delivery', 'Puzzles & activities', 'Reading recommendations'],
    popular: true,
  },
  {
    name: 'Premium',
    price: '1199',
    tagline: 'For book-loving households',
    features: ['6 books at a time', 'Unlimited swaps', 'Same-day delivery', 'Early access to new titles', 'Dedicated support'],
    popular: false,
  },
];

export default function PricingPlans() {
  return (
    <section className="bg-cream py-16 lg:py-24">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="font-body text-[18px] font-medium uppercase tracking-[2px] text-primary-light">Membership</p>
          <h2 className="mx-auto mt-3 max-w-[760px] font-heading text-[32px] font-extrabold leading-[1.1] tracking-[-1px] text-ink sm:text-[42px] lg:text-[48px]">
            Choose a plan that grows with your child
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 items-stretch gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-[28px] border p-8 transition-all ${
                plan.popular
                  ? 'border-primary bg-white shadow-2xl md:-translate-y-3'
                  : 'border-black/5 bg-white shadow-md'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 font-heading text-xs font-bold uppercase tracking-wide text-white">
                  Most popular
                </span>
              )}
              <h3 className="font-heading text-[24px] font-extrabold text-ink">{plan.name}</h3>
              <p className="mt-1 text-[15px] font-medium text-text-muted">{plan.tagline}</p>
              <div className="mt-5 flex items-end gap-1">
                <span className="font-heading text-[44px] font-black text-ink">₹{plan.price}</span>
                <span className="mb-2 text-[16px] font-semibold text-text-muted">/mo</span>
              </div>

              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-[16px] font-medium text-ink/80">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                to="/membership"
                className={`mt-8 rounded-full px-6 py-3.5 text-center font-heading text-[17px] font-bold transition-colors ${
                  plan.popular
                    ? 'bg-primary text-white hover:bg-primary-dark'
                    : 'border-2 border-primary text-ink hover:bg-primary/5'
                }`}
              >
                Choose {plan.name}
              </Link>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-sm font-medium text-text-muted">
          Prices shown are illustrative — confirm current plans on the Membership page.
        </p>
      </div>
    </section>
  );
}
