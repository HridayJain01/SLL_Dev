import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { getMembershipWhatsAppLink } from '@/lib/whatsapp';
import { PLAN_ORDER, PLAN_TABS, usePlans, type PlanCode, type PlanDuration } from '@/lib/plans';

export default function Membership() {
  const [duration, setDuration] = useState<PlanDuration>(1);

  return (
    <section className="bg-[#f8f1e8] py-16 sm:py-20">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Pricing & Plan</p>
          <h1 className="mt-4 font-display text-4xl font-bold leading-[0.95] text-ink sm:text-5xl lg:text-7xl">
            Choose a plan that grows
            <br />
            with your child
          </h1>
        </div>

        <div className="mt-10 flex justify-center">
          {/* Four tabs don't fit one row on a phone, so they sit 2×2 until there
              is room for the single-row pill. */}
          <div className="grid w-full max-w-[320px] grid-cols-2 gap-1 rounded-[28px] bg-white p-1.5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] sm:inline-flex sm:w-auto sm:max-w-none sm:gap-0 sm:rounded-full">
            {PLAN_TABS.map((tab) => {
              const active = duration === tab.duration;
              return (
                <button
                  key={tab.duration}
                  type="button"
                  onClick={() => setDuration(tab.duration)}
                  className={`rounded-full px-4 py-3 text-sm font-semibold transition sm:px-8 ${
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
            <PlanCard key={planCode} planCode={planCode} duration={duration} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PlanCard({ planCode, duration }: { planCode: PlanCode; duration: PlanDuration }) {
  const plan = usePlans()[planCode];
  const price = plan.pricing[duration].price;

  return (
    <article className="group relative rounded-[30px] border-2 border-transparent bg-white px-7 pb-9 pt-8 shadow-sm transition-colors hover:border-primary">
      {plan.badge && (
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-white px-5 py-1.5 text-sm font-extrabold uppercase tracking-[0.12em] text-ink">
          {plan.badge}
        </div>
      )}

      <div className="text-center">
        <h2 className="font-heading text-3xl font-extrabold text-ink">{plan.label}</h2>
        <p className="mt-2 text-lg text-slate-600">{plan.subtitle}</p>
        <div className="mt-8">
          <span className="font-display text-5xl font-bold text-navy sm:text-6xl">₹{price}</span>
          <span className="text-2xl font-semibold text-navy">/{duration === 1 ? 'mo' : duration === 12 ? 'yr' : `${duration}mo`}</span>
        </div>
      </div>

      <a
        href={getMembershipWhatsAppLink(planCode, duration, price)}
        target="_blank"
        rel="noreferrer"
        className="mt-8 block rounded-full border border-primary px-6 py-4 text-center text-xl font-bold text-ink transition group-hover:bg-primary group-hover:text-white"
      >
        Join Now
      </a>

      <ul className="mt-10 space-y-4">
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
    </article>
  );
}
