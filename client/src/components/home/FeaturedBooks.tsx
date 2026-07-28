import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const TABS = ['All', 'Story Books', 'Picture Books', 'Puzzles', 'Activity'] as const;

type Tab = (typeof TABS)[number];

interface Book {
  title: string;
  author: string;
  age: string;
  category: Exclude<Tab, 'All'>;
  cover: string;
}

const BOOKS: Book[] = [
  {
    title: 'The Very Hungry Caterpillar',
    author: 'Eric Carle',
    age: '2-4',
    category: 'Story Books',
    cover: 'from-[#6EC7C4] to-[#4A9FB3]',
  },
  {
    title: 'Where the Wild Things Are',
    author: 'Maurice Sendak',
    age: '4-6',
    category: 'Story Books',
    cover: 'from-[#7DC3E5] to-[#518DC5]',
  },
  {
    title: 'Goodnight Moon',
    author: 'Margaret Wise Brown',
    age: '0-2',
    category: 'Picture Books',
    cover: 'from-[#EF6C6C] to-[#E96067]',
  },
  {
    title: 'The Gruffalo',
    author: 'Julia Donaldson',
    age: '4-6',
    category: 'Story Books',
    cover: 'from-[#7558A7] to-[#70539F]',
  },
  {
    title: 'Green Eggs and Ham',
    author: 'Dr. Seuss',
    age: '4-6',
    category: 'Story Books',
    cover: 'from-[#F9A72E] to-[#F4A42A]',
  },
  {
    title: 'Guess How Much I Love You',
    author: 'Sam McBratney',
    age: '2-4',
    category: 'Picture Books',
    cover: 'from-[#33A7A4] to-[#3AA8A2]',
  },
  {
    title: 'Guess How Much I Love You',
    author: 'Sam McBratney',
    age: '2-4',
    category: 'Picture Books',
    cover: 'from-[#11914B] to-[#12974F]',
  },
  {
    title: 'Guess How Much I Love You',
    author: 'Sam McBratney',
    age: '2-4',
    category: 'Picture Books',
    cover: 'from-[#39A79D] to-[#3AA79F]',
  },
];

export default function FeaturedBooks() {
  const [active] = useState<Tab>('All');

  const visible = useMemo(
    () => (active === 'All' ? BOOKS : BOOKS.filter((b) => b.category === active)),
    [active],
  );

  return (
    <section
      className="py-20 lg:py-28"
      style={{ backgroundColor: '#F9F6EF' }}
    >
      <div className="mx-auto max-w-[1280px] px-6">
        {/* Heading */}
        <div className="text-center">
          <h2 className="font-heading text-[52px] font-black text-[#25302B] lg:text-[60px]">
            Featured books
          </h2>

          <p className="mt-3 text-[18px] text-[#66706E]">
            Some of our most loved titles
          </p>
        </div>

        {/* Grid */}
        <div className="mt-14 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {visible.map((book) => (
            <Link key={book.title + book.author} to="/library" className="group">
              <div className="overflow-hidden rounded-[18px] bg-white shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-xl">

                {/* Cover */}
                <div
                  className={`relative flex h-[230px] items-center justify-center overflow-hidden bg-gradient-to-br ${book.cover}`}
                >
                  {/* Decorative Circles */}
                  <div className="absolute -left-6 -top-6 h-20 w-20 rounded-full bg-white/15"></div>
                  <div className="absolute -bottom-7 -right-7 h-24 w-24 rounded-full bg-white/15"></div>

                  <h3 className="px-6 text-center font-heading text-[28px] font-bold leading-tight text-white">
                    {book.title}
                  </h3>
                </div>

                {/* Card Body */}
                <div className="p-4">
                  <h4 className="truncate text-[15px] font-bold text-[#25302B]">
                    {book.title}
                  </h4>

                  <div className="mt-2">
                    <span className="rounded bg-[#F2F2F2] px-2 py-1 text-[11px] font-medium text-[#666]">
                      {book.age} years
                    </span>
                  </div>

                  <p className="mt-4 text-[13px] font-medium text-[#FF6D2D] transition-all group-hover:translate-x-1">
                    View Details →
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}