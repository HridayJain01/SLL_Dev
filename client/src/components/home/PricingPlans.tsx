import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PLAN_ORDER, PLAN_TABS, usePlans, type PlanDuration } from '@/lib/plans';
import iconCheck from '@/assets/figma/icon-check.svg';
import iconCross from '@/assets/figma/icon-cross.svg';

export default function PricingPlans() {
  const [duration, setDuration] = useState<PlanDuration>(1);
  const plans = usePlans();
  const unit = duration === 1 ? 'mo' : duration === 12 ? 'yr' : `${duration}mo`;

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
            {PLAN_TABS.map((tab) => (
              <button
                key={tab.duration}
                type="button"
                onClick={() => setDuration(tab.duration)}
                className={`h-[35.391px] rounded-[999px] px-3 text-[14px] leading-[21px] tracking-[-0.1504px] transition-colors sm:px-4 ${
                  duration === tab.duration
                    ? 'bg-[#ef692b] font-bold text-white'
                    : 'font-medium text-[#6b7280] hover:text-[#26332d]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Plans */}
        <div className="relative mt-10 grid grid-cols-1 gap-6 lg:mt-[54px] lg:grid-cols-3">
          {PLAN_ORDER.map((code) => {
            const plan = plans[code];
            const features = [
              ...plan.features.map((label) => ({ label, included: true })),
              ...(plan.excludedFeatures ?? []).map((label) => ({ label, included: false })),
            ];
            return (
              <div
                key={code}
                className="group relative flex flex-col items-center rounded-[16px] border-2 border-transparent bg-white px-6 pb-8 pt-[27.67px] transition-colors hover:border-[#ef692b] lg:h-[596px] lg:px-0 lg:pb-0"
              >
                {plan.badge && (
                  <span className="absolute -top-[13px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[999px] border border-[#fea121] bg-white px-4 py-1 font-body text-[11.52px] font-extrabold uppercase leading-[17.28px] tracking-[0.7236px] text-black drop-shadow-[0px_4px_6px_rgba(212,98,58,0.3)]">
                    {plan.badge}
                  </span>
                )}

                <p className="font-heading text-[24px] font-bold leading-7 text-[#0a0a0a]">
                  {plan.label}
                </p>
                <p className="mt-[6.65px] font-body text-[16px] font-medium leading-[26px] text-[#303030]">
                  {plan.subtitle}
                </p>
                <p className="mt-[22.68px] font-body text-[48px] font-bold leading-[60px] tracking-[-2px] text-[#0f172a]">
                  {plan.pricing[duration].price}/{unit}
                </p>

                {/* Outlined at rest; the whole card lights up orange on hover. */}
                <Link
                  to="/membership"
                  className="mt-[24px] flex w-full items-center justify-center rounded-[50px] border border-[#ef692b] px-3 py-4 font-heading text-[18px] font-bold leading-[21.6px] text-[#1a1a1a] transition-colors group-hover:bg-[#ef692b] group-hover:text-[#fdfdfd] lg:w-[271px]"
                >
                  Join Now
                </Link>

                <ul className="mt-[35px] flex w-full flex-col gap-3 lg:w-[319px]">
                  {features.map((f) => (
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
            );
          })}
        </div>
      </div>
    </section>
  );
}
