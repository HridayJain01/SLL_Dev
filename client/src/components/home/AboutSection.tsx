import aboutPhoto from '@/assets/figma/about-photo.jpg';
import squiggle from '@/assets/figma/squiggle.svg';
import iconBooks from '@/assets/figma/icon-books.svg';
import iconPuzzle from '@/assets/figma/icon-puzzle.svg';
import iconAge from '@/assets/figma/icon-age.svg';
import iconSwap from '@/assets/figma/icon-swap.svg';

const STATS = [
  { value: '400+', label: 'Curated books', icon: iconBooks, chip: '#e4e6ff' },
  { value: '2–8', label: 'Age based learning', icon: iconAge, chip: '#dff7ff' },
  { value: '150+', label: 'Puzzles & activities', icon: iconPuzzle, chip: '#e8f5f3' },
  { value: '30 days', label: 'Fresh picks every month', icon: iconSwap, chip: 'rgba(233,109,109,0.21)' },
];

export default function AboutSection() {
  return (
    <section className="relative w-full overflow-x-clip bg-white pb-20 pt-24 lg:pb-[149px] lg:pt-[161px]">
      {/* Purple doodle tucked above the photo */}
      <img
        src={squiggle}
        alt=""
        aria-hidden
        className="pointer-events-none absolute left-6 top-8 hidden h-[75.68px] w-[78.06px] lg:block"
        style={{ left: 'calc(50% - 680px)', top: 70 }}
      />
      <div className="mx-auto flex w-full max-w-[1298px] flex-col gap-10 px-6 lg:flex-row lg:items-start lg:gap-[42px] lg:px-0">
        {/* Photo */}
        <div className="shrink-0 overflow-hidden rounded-[16px] lg:h-[541px] lg:w-[604.928px]">
          <img
            src={aboutPhoto}
            alt="A mother and daughter reading together"
            className="h-full w-full object-cover object-top"
          />
        </div>

        {/* Copy + stats */}
        <div className="lg:w-[651px]">
          <p className="font-body text-[18px] font-semibold uppercase leading-[32.4px] tracking-[2px] text-[#fe753b]">
            About Us
          </p>
          <h2 className="mt-3 font-heading text-[36px] font-medium leading-[1.15] tracking-[-1px] text-[#26332d] sm:text-[44px] lg:max-w-[484px] lg:text-[52px] lg:leading-[59.8px]">
            More books,
            <br />
            less screen time
          </h2>
          <p className="mt-[18.6px] max-w-[478px] font-body text-[20px] font-semibold leading-[28px] text-[#4a5565]">
            Star Learners brings a whole library to your doorstep. Pick from 400+ books and 150+
            puzzles, get them delivered and exchange
            <br className="hidden lg:inline" />{' '}
            when your child is ready for something new.
          </p>

          <div className="mt-[19px] grid grid-cols-1 gap-x-px gap-y-[19px] sm:grid-cols-2">
            {STATS.map((s) => (
              <div key={s.label} className="flex items-start gap-4 sm:w-[316.5px]">
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px]"
                  style={{ backgroundColor: s.chip }}
                >
                  <img src={s.icon} alt="" className="h-6 w-6" />
                </span>
                <div>
                  <p className="font-heading text-[36px] font-medium leading-[46.8px] tracking-[-0.8px] text-[#2c2c2c]">
                    {s.value}
                  </p>
                  <p className="font-body text-[20px] font-semibold leading-[28px] text-[#4a5565]">
                    {s.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
