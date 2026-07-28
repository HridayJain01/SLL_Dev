import { Link } from 'react-router-dom';
import centerImage from '@/assets/figma/how-it-works-center.jpg'; // <-- Replace with your image

const STEPS = [
  {
    n: 1,
    title: 'Pick your perfect plan',
    desc: 'Select a subscription that fits your child’s reading needs',
    bg: '#FBE2D8',
  },
  {
    n: 2,
    title: 'Borrow books they’ll love',
    desc: 'Receive curated books and puzzles delivered to your doorstep',
    bg: '#E8E8FB',
  },
  {
    n: 3,
    title: 'Delivered, ready to enjoy',
    desc: 'Sit back while your child dives into stories picked just for them',
    bg: '#E6F5EF',
  },
  {
    n: 4,
    title: 'Swap, discover, repeat',
    desc: 'Exchange monthly and keep the reading journey fresh',
    bg: '#FFF8D8',
  },
];

function StepCard({
  number,
  title,
  desc,
  bg,
}: {
  number: number;
  title: string;
  desc: string;
  bg: string;
}) {
  return (
    <div
      className="flex min-h-[240px] flex-col items-center justify-center rounded-[30px] px-8 py-10 text-center"
      style={{ backgroundColor: bg }}
    >
      <h3 className="text-[24px] font-black leading-none text-[#26322D]">
        {number}.
      </h3>

      <h4 className="mt-3 font-heading text-[24px] font-black leading-tight text-[#26322D]">
        {title}
      </h4>

      <p className="mt-6 text-[17px] leading-8 text-[#596463]">
        {desc}
      </p>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section
      className="py-20 lg:py-28"
      style={{ backgroundColor: '#F9F6EF' }}
    >
      <div className="mx-auto max-w-[1280px] px-6">
        {/* Heading */}
        <div className="text-center">
          <h2 className="font-heading text-[52px] font-black text-[#26322D] lg:text-[64px]">
            How it works
          </h2>

          <p className="mx-auto mt-5 max-w-[650px] text-[20px] leading-9 text-[#5D6765]">
            We make reading easy — curated books, doorstep delivery,
            <br className="hidden md:block" />
            and fresh picks every month.
          </p>
        </div>

        {/* Main Grid */}
        <div className="mt-16 grid gap-6 lg:grid-cols-[1fr_1.05fr_1fr]">
          {/* Left */}
          <div className="flex flex-col justify-between">
            <StepCard {...STEPS[0]} number={STEPS[0].n} />
            <StepCard {...STEPS[1]} number={STEPS[1].n} />
          </div>

          {/* Center Image */}
          <div className="relative overflow-hidden rounded-[30px]">
            <img
              src={centerImage}
              alt="Reading child"
              className="h-full min-h-[510px] w-full object-cover"
            />

            {/* Bottom Gradient */}
            <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#09A7E8]/70 via-[#09A7E8]/20 to-transparent" />

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
              <Link
                to="/library"
                className="rounded-full bg-[#F9732A] px-8 py-4 font-heading text-[17px] font-bold text-white transition hover:scale-105"
              >
                Explore Library
              </Link>
            </div>
          </div>

          {/* Right */}
          <div className="flex flex-col justify-between">
            <StepCard {...STEPS[2]} number={STEPS[2].n} />
            <StepCard {...STEPS[3]} number={STEPS[3].n} />
          </div>
        </div>
      </div>
    </section>
  );
}