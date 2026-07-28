import bg from '@/assets/figma/testimonials-bg.jpg';
import quoteOrange from '@/assets/figma/quote-e.svg';
import quoteGreen from '@/assets/figma/quote-d.svg';
import quoteIndigo from '@/assets/figma/quote-b.svg';
import quotePink from '@/assets/figma/quote-c.svg';

interface Testimonial {
  quote: string;
  name: string;
  role: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'My son used to resist reading time. Three months into Star Learners and he’s the one reminding me it’s book time. I genuinely didn’t expect it to work this fast.',
    name: 'Soumya Jain',
    role: 'Mum of twins',
  },
  {
    quote:
      'My 4-year-old actually looks forward to reading time now. The books always feel just right for her age, and I love not having to keep buying new ones every month.',
    name: 'Ankit Sharma',
    role: 'Dad of 4 year old',
  },
  {
    quote:
      'The monthly swap is a game changer. No clutter at home, and my son always has something new to explore. The quality and condition of books has been great too.',
    name: 'Krati Mehta',
    role: 'Mom of 6 years old',
  },
  {
    quote:
      'I was a little unsure at first, but the experience has been super smooth. The books arrive clean, well-packed, and thoughtfully selected. It just makes life easier.',
    name: 'Ankit Sharma',
    role: 'Dad of 3 year',
  },
  {
    quote:
      'My daughter gets so excited on exchange day. She lines up the new books herself and picks which one to read first.',
    name: 'Kavitha Singh',
    role: 'Mum of 6 year old',
  },
  {
    quote:
      'My husband and I actually fight over who gets to do bedtime now because it means getting to read with her. Star Learners made reading the best part of our day.',
    name: 'Divya Krishnan',
    role: 'Mom of 5 years old',
  },
];

/* Card skins cycle every four, and the rail dips through a shallow arc. */
const SKINS = [
  { bg: '#ffffec', quote: quoteOrange },
  { bg: '#e8f5ee', quote: quoteGreen },
  { bg: '#eff0fe', quote: quoteIndigo },
  { bg: '#ffe8de', quote: quotePink },
];
const ARC = [0, 14.4, 28.8, 43.2, 28.8, 14.4];

function Card({ t, index }: { t: Testimonial; index: number }) {
  const skin = SKINS[index % SKINS.length];
  return (
    <div
      className="flex h-[384px] w-[337px] shrink-0 items-center rounded-[33px] px-[29px] py-[15px]"
      style={{ backgroundColor: skin.bg, transform: `translateY(${ARC[index % ARC.length]}px)` }}
    >
      <div className="flex h-[342px] w-[279px] flex-col justify-between">
        <div className="flex flex-col gap-4">
          <img src={skin.quote} alt="" className="h-[72px] w-[67.5px]" />
          <p className="font-body text-[18px] font-medium leading-[1.2] text-[#413d45]">{t.quote}</p>
        </div>
        <div className="flex flex-col gap-2">
          <p className="font-body text-[12px] font-medium leading-[16.2px] text-[#67646a]">
            {t.name}
          </p>
          <p className="font-body text-[9.9px] font-medium leading-[14.4px] tracking-[-0.108px] text-[#413d45]">
            {t.role}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Testimonials() {
  return (
    <section className="relative w-full overflow-hidden bg-[#26332d] py-16 lg:h-[958px] lg:py-0">
      <img src={bg} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />

      <div className="relative z-10 px-6 text-center lg:pt-[105px]">
        <p className="font-body text-[18px] font-medium uppercase leading-[32.4px] tracking-[2px] text-[#fe753b]">
          Testimonials
        </p>
        <h2 className="mt-3 font-heading text-[36px] font-extrabold leading-[1.1] tracking-[-1.44px] text-white sm:text-[48px] lg:text-[64px] lg:leading-[57.6px]">
          Why Parents Love Star Learners
        </h2>
      </div>

      {/* Card rail */}
      <div className="relative z-10 mt-12 w-full overflow-hidden lg:absolute lg:left-0 lg:top-[457px] lg:mt-0">
        <div className="flex w-max animate-marquee-slow">
          <div className="flex shrink-0 gap-[21.2px] pr-[21.2px]">
            {TESTIMONIALS.map((t, i) => (
              <Card key={t.name + i} t={t} index={i} />
            ))}
          </div>
          <div className="flex shrink-0 gap-[21.2px] pr-[21.2px]" aria-hidden>
            {TESTIMONIALS.map((t, i) => (
              <Card key={`dup-${t.name}-${i}`} t={t} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
