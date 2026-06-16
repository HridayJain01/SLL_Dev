import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const TABS = ['All', 'Story Books', 'Picture Books', 'Puzzles', 'Activity'] as const;

type Tab = (typeof TABS)[number];

interface Book {
  title: string;
  author: string;
  age: string;
  category: Exclude<Tab, 'All'>;
  cover: string; // gradient classes
}

const BOOKS: Book[] = [
  { title: 'The Sleepy Star', author: 'M. Rao', age: '2–4', category: 'Story Books', cover: 'from-amber-300 to-orange-400' },
  { title: 'Colours All Around', author: 'P. Iyer', age: '2–4', category: 'Picture Books', cover: 'from-sky-300 to-indigo-400' },
  { title: 'Animal Friends', author: 'S. Khan', age: '4–6', category: 'Picture Books', cover: 'from-emerald-300 to-teal-400' },
  { title: 'Puzzle Park', author: 'Team SL', age: '4–6', category: 'Puzzles', cover: 'from-rose-300 to-pink-400' },
  { title: 'Mighty Machines', author: 'A. Bose', age: '6–8', category: 'Story Books', cover: 'from-indigo-300 to-violet-400' },
  { title: 'Count With Me', author: 'R. Nair', age: '2–4', category: 'Activity', cover: 'from-lime-300 to-green-400' },
  { title: 'Ocean Wonders', author: 'D. Mehta', age: '6–8', category: 'Story Books', cover: 'from-cyan-300 to-blue-400' },
  { title: 'Maze Masters', author: 'Team SL', age: '6–8', category: 'Puzzles', cover: 'from-fuchsia-300 to-purple-400' },
];

export default function FeaturedBooks() {
  const [active, setActive] = useState<Tab>('All');

  const visible = useMemo(
    () => (active === 'All' ? BOOKS : BOOKS.filter((b) => b.category === active)),
    [active],
  );

  return (
    <section className="bg-cream py-16 lg:py-24">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="font-body text-[18px] font-medium uppercase tracking-[2px] text-primary-light">Our library</p>
          <h2 className="mx-auto mt-3 max-w-[760px] font-heading text-[32px] font-extrabold leading-[1.1] tracking-[-1px] text-ink sm:text-[42px] lg:text-[48px]">
            Books your child will actually finish
          </h2>
        </div>

        {/* Tabs */}
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActive(tab)}
              className={`rounded-full px-5 py-2 font-heading text-[15px] font-bold transition-colors ${
                active === tab ? 'bg-primary text-white' : 'bg-white text-ink hover:bg-primary/10'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="mt-10 grid grid-cols-2 gap-5 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {visible.map((book) => (
            <Link key={book.title} to="/library" className="group">
              <div
                className={`relative flex aspect-[3/4] items-end overflow-hidden rounded-[18px] bg-gradient-to-br ${book.cover} p-4 shadow-md transition-shadow group-hover:shadow-xl`}
              >
                <span className="absolute left-3 top-3 rounded-md bg-white/90 px-2 py-1 text-xs font-bold text-ink">
                  {book.age} yrs
                </span>
                <span className="font-heading text-[18px] font-extrabold leading-tight text-white drop-shadow">
                  {book.title}
                </span>
              </div>
              <h3 className="mt-3 truncate font-heading text-[17px] font-bold text-ink">{book.title}</h3>
              <p className="truncate text-sm font-medium text-text-muted">by {book.author}</p>
            </Link>
          ))}
        </div>

        {/* Pagination dots */}
        <div className="mt-10 flex items-center justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className={`h-2 rounded-full transition-all ${i === 0 ? 'w-6 bg-primary' : 'w-2 bg-primary/30'}`} />
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/library"
            className="inline-block rounded-full bg-primary px-8 py-4 font-heading text-[18px] font-bold text-white transition-colors hover:bg-primary-dark"
          >
            Explore the full library
          </Link>
        </div>
      </div>
    </section>
  );
}
