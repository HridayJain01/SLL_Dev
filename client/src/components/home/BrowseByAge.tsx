import { Link } from 'react-router-dom';

import kid1 from '@/assets/figma/0-2.jpg';
import kid2 from '@/assets/figma/2-4.jpg';
import kid3 from '@/assets/figma/4-6.jpg';
import kid4 from '@/assets/figma/6-8.jpg';

const AGE_GROUPS = [
  {
    range: '0-2 years',
    title: 'Sensory books\nand early learning',
    bg: '#6467D8',
    image: kid1,
  },
  {
    range: '2-4 years',
    title: 'Sensory books\nand early learning',
    bg: '#FFC61D',
    image: kid2,
  },
  {
    range: '4-6 years',
    title: 'Sensory books\nand early learning',
    bg: '#F54282',
    image: kid3,
  },
  {
    range: '6-8 years',
    title: 'Sensory books\nand early learning',
    bg: '#11934D',
    image: kid4,
  },
];

export default function BrowseByAge() {
  return (
    <section
      className="py-24"
      style={{ background: '#FFFFFF' }}
    >
      <div className="mx-auto max-w-[1280px] px-6">
        {/* Heading */}
        <div className="text-center">
          <h2 className="font-heading text-[56px] font-black text-[#25302B]">
            Browse by age
          </h2>

          <p className="mt-2 text-[20px] text-[#6A6A6A]">
            Age-appropriate books for every age group
          </p>
        </div>

        {/* Cards */}
        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {AGE_GROUPS.map((group) => (
            <Link
              key={group.range}
              to="/library"
              className="group"
            >
              <div
                className="relative h-[380px] overflow-hidden rounded-[24px] transition duration-300 group-hover:-translate-y-2"
                style={{ backgroundColor: group.bg }}
              >
                {/* Decorative circles */}
                <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/15" />
                <div className="absolute -left-8 bottom-10 h-24 w-24 rounded-full bg-white/15" />

                {/* Text */}
                <div className="absolute left-6 top-6 z-20">
                  <h3 className="text-[32px] font-black text-white">
                    {group.range}
                  </h3>

                  <p className="mt-2 whitespace-pre-line text-[17px] font-medium leading-6 text-white">
                    {group.title}
                  </p>
                </div>

                {/* Child */}
                <img
                  src={group.image}
                  alt={group.range}
                  className="absolute bottom-0 right-0 h-[290px] object-contain"
                />

                {/* Explore */}
                <div className="absolute bottom-5 left-5">
                  <span className="rounded-full bg-white px-5 py-2 text-[13px] font-bold text-[#25302B] shadow">
                    Explore
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}