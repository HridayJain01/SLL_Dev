import blob1 from '@/assets/figma/blob-1.svg';
import blob2 from '@/assets/figma/blob-2.svg';
import blob3 from '@/assets/figma/blob-3.svg';
import blob4 from '@/assets/figma/blob-4.svg';
import arrow1 from '@/assets/figma/arrow-1.svg';
import arrow2 from '@/assets/figma/arrow-2.svg';
import arrow3 from '@/assets/figma/arrow-3.svg';
import sparkle from '@/assets/figma/star-sparkle.svg';

const STEPS = [
  {
    n: 1,
    blob: blob1,
    title: 'Pick your perfect plan',
    desc: 'Select a subscription that fits your child’s reading needs',
  },
  {
    n: 2,
    blob: blob2,
    title: 'Borrow books they’ll love',
    desc: 'Browse our library and handpick the books and puzzles your child will love',
  },
  {
    n: 3,
    blob: blob3,
    title: 'Delivered, ready to enjoy',
    desc: 'Sit back while we pack and ship your selection straight to your home',
  },
  {
    n: 4,
    blob: blob4,
    title: 'Swap, discover, repeat',
    desc: 'Exchange monthly and keep the reading journey fresh',
  },
];

/* The three connectors are positioned off the 1281px-wide step row so they
   land in the gaps between blobs exactly as they do on the canvas. */
const CONNECTORS = [
  { src: arrow1, left: 261, top: 45, flip: false },
  { src: arrow2, left: 586, top: 45, flip: true },
  { src: arrow3, left: 925, top: 42, flip: false },
];

export default function HowItWorks() {
  return (
    <section className="relative w-full overflow-x-clip bg-[#f9f6ef] py-16 lg:h-[776px] lg:py-0">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center gap-12 px-6 lg:gap-[68px] lg:px-0 lg:pt-[60px]">
        {/* Heading */}
        <div className="flex flex-col items-center gap-3 text-center lg:h-[225px] lg:w-[1171px] lg:pt-[30px]">
          <p className="font-body text-[18px] font-medium uppercase leading-[32.4px] tracking-[2px] text-[#fe753b]">
            How it works
          </p>
          <h2 className="font-heading text-[36px] font-extrabold leading-[1.1] tracking-[-1.44px] text-[#1a1a1a] sm:text-[48px] lg:w-[1099px] lg:text-[64px] lg:leading-[57.6px]">
            Reading made simple.
            <br className="hidden lg:inline" />{' '}
            You pick, we deliver, we collect
          </h2>
        </div>

        {/* Steps */}
        <div className="relative grid w-full grid-cols-1 gap-10 sm:grid-cols-2 lg:flex lg:h-[251px] lg:w-[1281px] lg:gap-[35px]">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="flex flex-col items-center gap-6 text-center lg:h-[251px] lg:w-[294px]"
            >
              <div className="relative h-[99px] w-[102px] shrink-0">
                <img src={s.blob} alt="" className="absolute inset-0 block h-full w-full" />
                <span
                  className="absolute top-[23px] font-display text-[40px] font-semibold leading-[52px] tracking-[0.8px] text-[#002b51]"
                  style={{ left: 'calc(50% - 7.5px)' }}
                >
                  {s.n}
                </span>
              </div>
              <div className="flex flex-col gap-[2px]">
                <p className="font-heading text-[24px] font-extrabold leading-[33.6px] text-[#002b51]">
                  {s.title}
                </p>
                <p className="font-body text-[18px] font-medium leading-[28px] text-[#47524d]">
                  {s.desc}
                </p>
              </div>
            </div>
          ))}

          {CONNECTORS.map((c) => (
            <img
              key={c.left}
              src={c.src}
              alt=""
              aria-hidden
              className={`pointer-events-none absolute hidden h-[15.8px] w-[108px] lg:block ${
                c.flip ? '-scale-x-100 rotate-180' : ''
              }`}
              style={{ left: c.left, top: c.top }}
            />
          ))}
        </div>
      </div>

      <img
        src={sparkle}
        alt=""
        aria-hidden
        className="pointer-events-none absolute hidden h-[21px] w-[21px] lg:block"
        style={{ left: 'calc(50% + 575px)', top: 343 }}
      />
    </section>
  );
}
