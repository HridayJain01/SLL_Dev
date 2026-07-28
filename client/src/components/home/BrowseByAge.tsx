import { Link } from 'react-router-dom';
import age02 from '@/assets/figma/age-0-2.png';
import age24 from '@/assets/figma/age-2-4.png';
import ageBlocks from '@/assets/figma/age-blocks.png';
import arrowRight from '@/assets/figma/arrow-right.svg';
import mascotPeek from '@/assets/figma/mascot-peek.png';

interface AgeGroup {
  range: string;
  blurb: string;
  panel: string;
  photoBg: string;
  image: string;
  /* Photo geometry, in the 291×236 coordinate space of the coloured panel. */
  imgLeft: number;
  imgTop: number;
  imgWidth: number;
  imgHeight: number;
}

const AGE_GROUPS: AgeGroup[] = [
  {
    range: '0-2 years',
    blurb: 'Little hands, big discoveries',
    panel: '#eff0fe',
    photoBg: '#5e66da',
    image: age02,
    imgLeft: 42,
    imgTop: -12,
    imgWidth: 216,
    imgHeight: 270,
  },
  {
    range: '2-4 years',
    blurb: 'Stories that grow with them',
    panel: '#e8f5ee',
    photoBg: '#068850',
    image: age24,
    imgLeft: -3,
    imgTop: -18,
    imgWidth: 291,
    imgHeight: 270,
  },
  {
    range: '4-6 years',
    blurb: 'The age of asking why',
    panel: '#ffe8de',
    photoBg: '#f54480',
    image: ageBlocks,
    imgLeft: 60,
    imgTop: -61,
    imgWidth: 223,
    imgHeight: 297,
  },
  {
    range: '6-8 years',
    blurb: 'Thinkers, dreamers & readers',
    panel: '#ffffec',
    photoBg: '#f4a736',
    image: ageBlocks,
    imgLeft: 60,
    imgTop: -61,
    imgWidth: 223,
    imgHeight: 297,
  },
];

export default function BrowseByAge() {
  return (
    <section className="relative w-full overflow-hidden bg-white py-16 lg:h-[857px] lg:py-0">
      <div className="mx-auto flex w-full max-w-[1236px] flex-col gap-8 px-6 lg:gap-[30px] lg:px-0 lg:pt-[60px]">
        {/* Heading */}
        <div className="flex flex-col items-center gap-3 text-center lg:h-[225px] lg:pt-[30px]">
          <p className="font-body text-[18px] font-medium uppercase leading-[32.4px] tracking-[2px] text-[#fe753b]">
            Browse by age
          </p>
          <h2 className="font-heading text-[36px] font-extrabold leading-[1.1] tracking-[-1.44px] text-[#1a1a1a] sm:text-[48px] lg:w-[1099px] lg:text-[64px] lg:leading-[57.6px]">
            Books &amp; puzzles curated
            <br className="hidden lg:inline" />{' '}
            for every stage of growth
          </h2>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:flex lg:items-center">
          {AGE_GROUPS.map((g) => (
            <Link
              key={g.range}
              to="/library"
              className="group flex flex-col overflow-hidden rounded-[12px] lg:w-[291px]"
            >
              <div
                className="flex h-[143px] flex-col rounded-t-[12px] px-5 py-[18px]"
                style={{ backgroundColor: g.panel }}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1 text-black">
                    <p className="font-heading text-[24px] font-bold leading-8">{g.range}</p>
                    {/* The design lets the longest blurb run past the padding
                        box rather than wrap onto a second line. */}
                    <p className="font-body text-[18px] font-semibold leading-5 lg:whitespace-nowrap">
                      {g.blurb}
                    </p>
                  </div>
                  <span className="flex w-[82px] items-center justify-between rounded-[500px]">
                    <span className="font-['Plus_Jakarta_Sans'] text-[16px] font-medium leading-[17.6px] text-[#002b51]">
                      Explore
                    </span>
                    <img
                      src={arrowRight}
                      alt=""
                      className="h-4 w-[15px] transition-transform group-hover:translate-x-1"
                    />
                  </span>
                </div>
              </div>
              <div
                className="relative -mt-[9px] h-[236px] overflow-hidden rounded-b-[12px]"
                style={{ backgroundColor: g.photoBg }}
              >
                {/* Oversized translucent disc bleeding out of the top-left */}
                <span className="absolute -left-[223px] -top-[134px] h-[386px] w-[386px] rounded-full bg-white/20" />
                <img
                  src={g.image}
                  alt={`Child aged ${g.range}`}
                  className="absolute max-w-none object-cover"
                  style={{
                    left: g.imgLeft,
                    top: g.imgTop,
                    width: g.imgWidth,
                    height: g.imgHeight,
                  }}
                />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Mascot loitering under the cards; it deliberately spills into the
          section below. */}
      <img
        src={mascotPeek}
        alt=""
        aria-hidden
        className="pointer-events-none absolute hidden h-[266px] w-[246px] lg:block"
        style={{ left: 'calc(50% - 608px)', top: 707 }}
      />
    </section>
  );
}
