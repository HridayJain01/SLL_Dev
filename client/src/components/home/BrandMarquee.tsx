interface Pill {
  label: string;
  bg: string;
  /* Two of the six badges are set in Poppins Bold rather than Inter SemiBold. */
  poppins?: boolean;
}

const TOP_PILLS: Pill[] = [
  { label: 'No app required', bg: '#5e66da' },
  { label: '400+ books', bg: '#f54480' },
  { label: 'Learn better', bg: '#068850', poppins: true },
];

const BOTTOM_PILLS: Pill[] = [
  { label: '150+ puzzles', bg: '#068850' },
  { label: 'Doorstep delivery', bg: '#faab37' },
  { label: 'Online school', bg: '#5e66da', poppins: true },
];

function PillRow({ pills }: { pills: Pill[] }) {
  return (
    <div className="flex shrink-0 items-center gap-[470px] pr-[470px]">
      {pills.map((p) => (
        <span
          key={p.label}
          className={`flex h-[52.797px] shrink-0 items-center whitespace-nowrap rounded-[50px] px-5 text-[16px] leading-[28.8px] text-[#fdfdfd] ${
            p.poppins ? "font-['Poppins'] font-bold" : 'font-body font-semibold'
          }`}
          style={{ backgroundColor: p.bg }}
        >
          {p.label}
        </span>
      ))}
    </div>
  );
}

export default function BrandMarquee() {
  return (
    <section className="relative w-full overflow-hidden bg-white py-12 lg:h-[606px] lg:py-0">
      {/* Top badge rail */}
      <div className="w-full overflow-hidden lg:absolute lg:left-0 lg:top-[41px]">
        <div className="flex w-max animate-marquee-reverse">
          <PillRow pills={TOP_PILLS} />
          <PillRow pills={TOP_PILLS} />
        </div>
      </div>

      {/* Oversized wordmark */}
      <div className="my-10 w-full overflow-hidden lg:absolute lg:left-0 lg:top-[149px] lg:my-0 lg:h-[275px]">
        <div className="flex w-max animate-marquee-slow">
          <span className="shrink-0 whitespace-nowrap pr-8 font-heading text-[96px] font-extrabold leading-[1] text-[#26332d] sm:text-[160px] lg:pr-0 lg:text-[280px] lg:leading-[275px]">
            &nbsp;Star Learners
          </span>
          <span
            aria-hidden
            className="shrink-0 whitespace-nowrap pr-8 font-heading text-[96px] font-extrabold leading-[1] text-[#26332d] sm:text-[160px] lg:pr-0 lg:text-[280px] lg:leading-[275px]"
          >
            &nbsp;Star Learners
          </span>
        </div>
      </div>

      {/* Bottom badge rail */}
      <div className="w-full overflow-hidden lg:absolute lg:left-0 lg:top-[479.2px]">
        <div className="flex w-max animate-marquee">
          <PillRow pills={BOTTOM_PILLS} />
          <PillRow pills={BOTTOM_PILLS} />
        </div>
      </div>
    </section>
  );
}
