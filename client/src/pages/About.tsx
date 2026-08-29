import { Link } from 'react-router-dom';
import CtaSection from '@/components/home/CtaSection';
import aboutPhoto from '@/assets/figma/about-photo.jpg';
import kidReading from '@/assets/figma/Kidreadingbook.jpg';
import squiggle from '@/assets/figma/squiggle.svg';
import sparkle from '@/assets/figma/star-sparkle.svg';
import splash from '@/assets/figma/hero-splash.svg';
import iconBooks from '@/assets/figma/icon-books.svg';
import iconPuzzle from '@/assets/figma/icon-puzzle.svg';
import iconAge from '@/assets/figma/icon-age.svg';
import iconSwap from '@/assets/figma/icon-swap.svg';
import iconCheck from '@/assets/figma/icon-check.svg';

const STATS = [
  { value: '400+', label: 'Curated books', icon: iconBooks, chip: '#e4e6ff' },
  { value: '2–8', label: 'Age based learning', icon: iconAge, chip: '#dff7ff' },
  { value: '150+', label: 'Puzzles & activities', icon: iconPuzzle, chip: '#e8f5f3' },
  { value: '30 days', label: 'Fresh picks every month', icon: iconSwap, chip: 'rgba(233,109,109,0.21)' },
];

const VALUES = [
  {
    icon: iconBooks,
    chip: '#e4e6ff',
    title: 'Curated, never random',
    desc: 'Every title is read and vetted before it earns a place on the shelf. No filler, no tired reprints.',
  },
  {
    icon: iconAge,
    chip: '#dff7ff',
    title: 'Right book, right age',
    desc: 'Our collection is grouped into 2–4, 4–6 and 6–8 stages, so what arrives always fits your child today.',
  },
  {
    icon: iconPuzzle,
    chip: '#e8f5f3',
    title: 'Play is learning too',
    desc: 'Puzzles and hands-on activities sit alongside the books, because attention is built, not demanded.',
  },
  {
    icon: iconSwap,
    chip: 'rgba(233,109,109,0.21)',
    title: 'Fresh shelves, zero clutter',
    desc: 'Swap every month. Your home stays uncluttered and the excitement of something new never wears off.',
  },
];

const PROMISES = [
  'Books sanitised and quality-checked between every single reader',
  'Free delivery and pickup, so you never plan a trip around a return',
  'Change or pause your plan whenever life gets busy',
];

export default function About() {
  return (
    <div className="w-full">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative w-full overflow-x-clip bg-cream pb-20 pt-14 lg:pb-28 lg:pt-20">
        <div className="mx-auto grid w-full max-w-[1280px] items-center gap-12 px-6 lg:grid-cols-2 lg:gap-[72px] lg:px-8">
          {/* Copy */}
          <div className="relative">
            <img
              src={sparkle}
              alt=""
              aria-hidden
              className="pointer-events-none absolute -left-2 -top-7 h-[21px] w-[21px]"
            />
            <p className="font-body text-[18px] font-semibold uppercase leading-[32.4px] tracking-[2px] text-primary-light">
              About Us
            </p>
            <h1 className="mt-3 font-heading text-[40px] font-medium leading-[1.06] tracking-[-1.5px] text-ink sm:text-[52px] lg:text-[60px] lg:tracking-[-2px]">
              Every child deserves a library of their own
            </h1>
            <p className="mt-6 max-w-[520px] font-body text-[20px] font-semibold leading-[30px] text-text-muted">
              Star Learners began with a small, stubborn belief — that a great children’s library
              shouldn’t depend on how much a family can spend on books. So we built one, and we send
              it to your doorstep a boxful at a time.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                to="/library"
                className="flex h-[56px] w-[165px] items-center justify-center rounded-[50px] bg-primary font-heading text-[18px] font-bold leading-[21.6px] text-[#fdfdfd] transition-colors hover:bg-primary-dark"
              >
                Browse Library
              </Link>
              <Link
                to="/membership"
                className="flex h-[56px] w-[165px] items-center justify-center rounded-[50px] border-2 border-primary font-heading text-[18px] font-bold leading-[21.6px] text-ink transition-colors hover:bg-primary/5"
              >
                View Plans
              </Link>
            </div>
          </div>

          {/* Photo */}
          <div className="relative mx-auto w-full max-w-[560px]">
            <img
              src={splash}
              alt=""
              aria-hidden
              className="pointer-events-none absolute -right-3 -top-8 z-20 h-[46px] w-[56px] lg:-right-6 lg:h-[53.9px] lg:w-[65.6px]"
            />
            {/* Yellow plate peeking out behind the photo */}
            <div
              aria-hidden
              className="absolute -bottom-4 -right-4 hidden h-full w-full rounded-[24px] bg-[#fed731] sm:block"
            />
            <div className="relative overflow-hidden rounded-[24px]">
              <img
                src={kidReading}
                alt="A toddler sitting on a rug, absorbed in a picture book"
                className="h-[360px] w-full object-cover object-center sm:h-[440px] lg:h-[500px]"
              />
            </div>

            {/* Floating credential card */}
            <div className="relative z-10 -mt-10 ml-4 w-fit rounded-[18px] bg-white px-6 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.12)] sm:ml-6">
              <p className="font-heading text-[28px] font-medium leading-none tracking-[-0.6px] text-ink">
                1,200+
              </p>
              <p className="mt-1 font-body text-[15px] font-semibold leading-[20px] text-text-muted">
                books borrowed and returned
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stat band ────────────────────────────────────────────────────── */}
      <section className="w-full bg-white py-14 lg:py-16">
        <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-x-6 gap-y-10 px-6 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
          {STATS.map((s) => (
            <div key={s.label} className="flex items-start gap-4">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px]"
                style={{ backgroundColor: s.chip }}
              >
                <img src={s.icon} alt="" className="h-6 w-6" />
              </span>
              <div>
                <p className="font-heading text-[32px] font-medium leading-[42px] tracking-[-0.8px] text-[#2c2c2c]">
                  {s.value}
                </p>
                <p className="font-body text-[18px] font-semibold leading-[26px] text-text-muted">
                  {s.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Our story ────────────────────────────────────────────────────── */}
      <section className="w-full overflow-x-clip bg-white pb-20 pt-6 lg:pb-28">
        <div className="mx-auto grid w-full max-w-[1280px] items-center gap-12 px-6 lg:grid-cols-2 lg:gap-[64px] lg:px-8">
          <div className="relative order-2 lg:order-1">
            <div
              aria-hidden
              className="absolute -bottom-5 -left-5 hidden h-full w-full rounded-[24px] bg-[#e8f5f3] sm:block"
            />
            <div className="relative overflow-hidden rounded-[24px] bg-[#f4f4f2]">
              <img
                src={aboutPhoto}
                alt="A mother and daughter reading together at a table"
                className="h-[420px] w-full object-cover object-center sm:h-[540px]"
              />
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <p className="font-body text-[18px] font-semibold uppercase leading-[32.4px] tracking-[2px] text-primary-light">
              Our story
            </p>
            <h2 className="mt-3 font-heading text-[34px] font-medium leading-[1.15] tracking-[-1px] text-ink sm:text-[42px] lg:text-[46px]">
              It started with one overflowing bookshelf
            </h2>
            <div className="mt-6 flex flex-col gap-5 font-body text-[18px] font-semibold leading-[30px] text-text-muted">
              <p>
                Picture books get outgrown fast. A title that a four-year-old asks for every night is
                quietly ignored six months later — and it still sits on the shelf, taking up space
                and money. Meanwhile the one book they’d actually love is in someone else’s home,
                already outgrown there too.
              </p>
              <p>
                That mismatch is the whole reason Star Learners exists. Instead of every family
                buying its own small, ageing collection, we maintain one large, carefully tended
                library and keep it moving between homes. Children get variety. Parents get their
                shelves back.
              </p>
            </div>

            <ul className="mt-8 flex flex-col gap-3">
              {PROMISES.map((p) => (
                <li key={p} className="flex items-start gap-3">
                  <span className="mt-[6px] flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-[#ffe8de]">
                    <img src={iconCheck} alt="" className="h-[11px] w-[13px]" />
                  </span>
                  <span className="font-body text-[17px] font-semibold leading-[26px] text-ink">
                    {p}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Mission & vision ─────────────────────────────────────────────── */}
      <section className="w-full bg-cream px-6 py-20 lg:px-8 lg:py-24">
        <div className="relative mx-auto w-full max-w-[1280px]">
          {/* Doodle parked in the empty half beside the section heading */}
          <img
            src={squiggle}
            alt=""
            aria-hidden
            className="pointer-events-none absolute right-8 top-0 hidden h-[75.68px] w-[78.06px] lg:block"
          />
          <div className="max-w-[640px]">
            <p className="font-body text-[18px] font-semibold uppercase leading-[32.4px] tracking-[2px] text-primary-light">
              What drives us
            </p>
            <h2 className="mt-3 font-heading text-[34px] font-medium leading-[1.12] tracking-[-1px] text-ink sm:text-[42px] lg:text-[48px]">
              Our mission and vision
            </h2>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {/* Mission */}
            <article className="relative overflow-hidden rounded-[24px] bg-[#fed731] px-8 py-10 lg:px-10 lg:py-12">
              <span className="inline-flex rounded-full bg-ink/10 px-4 py-1.5 font-body text-[13px] font-bold uppercase tracking-[1.5px] text-ink">
                Mission
              </span>
              <h3 className="mt-6 max-w-[420px] font-heading text-[28px] font-medium leading-[1.2] tracking-[-0.5px] text-ink sm:text-[32px]">
                Put a well-stocked library within reach of every family
              </h3>
              <p className="mt-4 max-w-[440px] font-body text-[18px] font-semibold leading-[28px] text-ink/70">
                Not just the ones who can spend thousands on books each year. Membership costs less
                than a couple of hardbacks, and it opens the whole shelf.
              </p>
              <img
                src={sparkle}
                alt=""
                aria-hidden
                className="pointer-events-none absolute right-8 top-8 h-[24px] w-[24px] opacity-70"
              />
            </article>

            {/* Vision */}
            <article className="relative overflow-hidden rounded-[24px] bg-ink px-8 py-10 lg:px-10 lg:py-12">
              <span className="inline-flex rounded-full bg-white/15 px-4 py-1.5 font-body text-[13px] font-bold uppercase tracking-[1.5px] text-white">
                Vision
              </span>
              <h3 className="mt-6 max-w-[420px] font-heading text-[28px] font-medium leading-[1.2] tracking-[-0.5px] text-white sm:text-[32px]">
                A generation that reaches for a book before a screen
              </h3>
              <p className="mt-4 max-w-[440px] font-body text-[18px] font-semibold leading-[28px] text-white/70">
                Reading early shapes empathy, focus and imagination long before it shows up on a
                report card. We want that head start to be ordinary, not a privilege.
              </p>
              <img
                src={sparkle}
                alt=""
                aria-hidden
                className="pointer-events-none absolute right-8 top-8 h-[24px] w-[24px] opacity-60"
              />
            </article>
          </div>
        </div>
      </section>

      {/* ── Values ───────────────────────────────────────────────────────── */}
      <section className="w-full bg-white px-6 py-20 lg:px-8 lg:py-24">
        <div className="mx-auto w-full max-w-[1280px]">
          <div className="mx-auto max-w-[720px] text-center">
            <p className="font-body text-[18px] font-semibold uppercase leading-[32.4px] tracking-[2px] text-primary-light">
              What we stand for
            </p>
            <h2 className="mt-3 font-heading text-[34px] font-medium leading-[1.12] tracking-[-1px] text-ink sm:text-[42px] lg:text-[48px]">
              Four things we refuse to compromise on
            </h2>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => (
              <article
                key={v.title}
                className="flex h-full flex-col rounded-[20px] border border-[#eceae4] bg-cream px-7 py-8 transition-shadow hover:shadow-[0_20px_44px_rgba(15,23,42,0.08)]"
              >
                <span
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[16px]"
                  style={{ backgroundColor: v.chip }}
                >
                  <img src={v.icon} alt="" className="h-7 w-7" />
                </span>
                <h3 className="mt-6 font-heading text-[21px] font-medium leading-[28px] text-navy">
                  {v.title}
                </h3>
                <p className="mt-3 font-body text-[17px] font-semibold leading-[26px] text-[#47524d]">
                  {v.desc}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <CtaSection />
    </div>
  );
}
