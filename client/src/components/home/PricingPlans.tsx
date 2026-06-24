import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { PLAN_DEFINITIONS, PLAN_ORDER, PLAN_TABS, type PlanCode, type PlanDuration } from '@/lib/plans';

export default function PricingPlans() {
  const [duration, setDuration] = useState<PlanDuration>(1);

  return (
    <section className="bg-[#f8f1e8] py-16 lg:py-24">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Pricing & Plan</p>
          <h2 className="mx-auto mt-4 max-w-4xl font-display text-4xl font-bold leading-[0.95] text-ink sm:text-5xl lg:text-7xl">
            Choose a plan that grows
            <br />
            with your child
          </h2>
        </div>

        <div className="mt-10 flex justify-center">
          <div className="inline-flex rounded-full bg-white p-1.5 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
            {PLAN_TABS.map((tab) => {
              const active = duration === tab.duration;
              return (
                <button
                  key={tab.duration}
                  type="button"
                  onClick={() => setDuration(tab.duration)}
                  className={`rounded-full px-5 py-3 text-sm font-semibold transition sm:px-8 ${
                    active ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {PLAN_ORDER.map((planCode) => (
            <HomePlanCard key={planCode} planCode={planCode} duration={duration} />
          ))}
        </div>
      </div>
    </section>
  );
}

function HomePlanCard({ planCode, duration }: { planCode: PlanCode; duration: PlanDuration }) {
  const plan = PLAN_DEFINITIONS[planCode];
  const isPopular = Boolean(plan.badge);
  const price = plan.pricing[duration].price;

  return (
    <div
      className={`relative flex flex-col rounded-[30px] bg-white px-7 pb-8 pt-8 shadow-sm ${
        isPopular ? 'border-2 border-primary shadow-[0_24px_60px_rgba(249,115,22,0.12)]' : 'border border-white/60'
      }`}
    >
      {plan.badge && (
        <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-white px-5 py-1.5 text-sm font-extrabold uppercase tracking-[0.12em] text-ink">
          {plan.badge}
        </span>
      )}

      <div className="text-center">
        <h3 className="font-heading text-3xl font-extrabold text-ink">{plan.label}</h3>
        <p className="mt-2 text-lg text-slate-600">{plan.subtitle}</p>
        <div className="mt-8">
          <span className="font-display text-5xl font-bold text-navy sm:text-6xl">₹{price}</span>
          <span className="text-2xl font-semibold text-navy">/{duration === 1 ? 'mo' : duration === 12 ? 'yr' : `${duration}mo`}</span>
        </div>
      </div>

      <Link
        to="/membership"
        className={`mt-8 block rounded-full px-6 py-4 text-center text-xl font-bold transition ${
          isPopular ? 'bg-primary text-white hover:bg-primary-dark' : 'border border-primary text-ink hover:bg-primary/5'
        }`}
      >
        Join Now
      </Link>

      <ul className="mt-10 flex-1 space-y-4">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-lg text-navy/90">
            <Check className="mt-1 h-5 w-5 shrink-0 text-primary" />
            <span>{feature}</span>
          </li>
        ))}
        {plan.excludedFeatures?.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-lg text-slate-400">
            <X className="mt-1 h-5 w-5 shrink-0 text-primary" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
