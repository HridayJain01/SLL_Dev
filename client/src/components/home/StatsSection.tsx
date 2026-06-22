import statsPhoto from '@/assets/figma/stats-photo.png';
import iconBooks from '@/assets/figma/icon-books.svg';
import iconPuzzle from '@/assets/figma/icon-puzzle.svg';
import iconAge from '@/assets/figma/icon-age.svg';
import iconCalendar from '@/assets/figma/icon-calendar.svg';

const STATS = [
  { value: '400+', label: 'Curated books', icon: iconBooks, chip: 'bg-chip-indigo' },
  { value: '150+', label: 'Puzzles & activities', icon: iconPuzzle, chip: 'bg-chip-mint' },
  { value: '2–8', label: 'Age based learning', icon: iconAge, chip: 'bg-chip-sky' },
  { value: '30 days', label: 'Fresh picks every month', icon: iconCalendar, chip: 'bg-chip-rose' },
];

export default function StatsSection() {
  return (
    <section className="relative bg-white py-16 lg:py-24">
      {/* Purple squiggle doodle, top-left above the photo */}
      <svg
        className="pointer-events-none absolute left-6 top-8 h-10 w-12 lg:left-10 lg:top-10"
        viewBox="0 0 48 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          d="M4 36C10 28 2 22 9 16C16 10 8 4 16 2M20 38C26 30 18 24 25 18C32 12 24 6 32 4"
          stroke="#6C6CF0"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="mx-auto grid max-w-[1311px] items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-[42px] lg:px-8">
        {/* Photo */}
        <div className="overflow-hidden rounded-[28px]">
          <img src={statsPhoto} alt="Children reading together" className="h-full w-full object-cover" />
        </div>

        {/* Content */}
        <div>
          <p className="font-body text-[18px] font-medium uppercase tracking-[2px] text-primary-light">About Us</p>
          <h2 className="mt-3 font-heading text-[36px] font-extrabold leading-[1.15] tracking-[-1px] text-ink sm:text-[44px] lg:text-[52px]">
            More books,
            <br />
            less screen time
          </h2>
          <p className="mt-5 max-w-[478px] text-[20px] font-semibold leading-[28px] text-text-muted">
            Star Learners brings a whole library to your doorstep. Pick from 400+ books and 150+ puzzles, get them
            delivered and exchange when your child is ready for something new.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
            {STATS.map((s) => (
              <div key={s.label} className="flex items-start gap-4">
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] ${s.chip}`}>
                  <img src={s.icon} alt="" className="h-6 w-6" />
                </span>
                <div>
                  <p className="font-heading text-[36px] font-extrabold leading-tight tracking-[-0.8px] text-[#2c2c2c]">
                    {s.value}
                  </p>
                  <p className="text-[20px] font-semibold leading-[28px] text-text-muted">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
