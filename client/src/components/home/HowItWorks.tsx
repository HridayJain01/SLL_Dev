import { Fragment } from 'react';
import step1 from '@/assets/figma/step-1.svg';
import step2 from '@/assets/figma/step-2.svg';
import step3 from '@/assets/figma/step-3.svg';
import step4 from '@/assets/figma/step-4.svg';
import arrow1 from '@/assets/figma/arrow-1.svg';
import arrow2 from '@/assets/figma/arrow-2.svg';
import arrow3 from '@/assets/figma/arrow-3.svg';

const STEPS = [
  {
    n: 1,
    badge: step1,
    title: 'Pick your perfect plan',
    desc: 'Select a subscription that fits your child’s reading needs',
  },
  {
    n: 2,
    badge: step2,
    title: 'Borrow books they’ll love',
    desc: 'Browse our library and handpick the books and puzzles your child will love',
  },
  {
    n: 3,
    badge: step3,
    title: 'Delivered, ready to enjoy',
    desc: 'Sit back while we pack and ship your selection straight to your home',
  },
  {
    n: 4,
    badge: step4,
    title: 'Swap, discover, repeat',
    desc: 'Exchange monthly and keep the reading journey fresh',
  },
];

const ARROWS = [arrow1, arrow2, arrow3];

export default function HowItWorks() {
  return (
    <section className="bg-cream py-16 lg:py-24">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="font-body text-[18px] font-medium uppercase tracking-[2px] text-primary-light">How it works</p>
          <h2 className="mx-auto mt-3 max-w-[1099px] font-heading text-[34px] font-extrabold leading-[1.06] tracking-[-1.44px] text-[#1a1a1a] sm:text-[48px] lg:text-[64px]">
            Reading made simple.
            <br className="hidden sm:block" /> You pick, we deliver, we collect
          </h2>
        </div>

        <div className="mt-14 flex flex-col items-center gap-10 lg:flex-row lg:items-start lg:justify-center lg:gap-[35px]">
          {STEPS.map((step, i) => (
            <Fragment key={step.n}>
              <div className="flex w-[294px] max-w-full flex-col items-center text-center">
                <div className="relative flex h-[99px] w-[102px] items-center justify-center">
                  <img src={step.badge} alt="" className="absolute inset-0 h-full w-full" />
                  <span className="relative mt-2 font-display text-[40px] font-semibold tracking-[0.8px] text-navy">
                    {step.n}
                  </span>
                </div>
                <h3 className="mt-6 font-heading text-[24px] font-extrabold leading-[33.6px] text-navy">{step.title}</h3>
                <p className="mt-1 text-[18px] font-medium leading-[28px] text-[#47524d]">{step.desc}</p>
              </div>
              {i < ARROWS.length && (
                <img src={ARROWS[i]} alt="" className="hidden h-8 w-16 shrink-0 self-start lg:mt-9 lg:block" />
              )}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
