import { Link } from 'react-router-dom';
import bookClosed from '@/assets/figma/book-closed.jpg';
import bookOpen from '@/assets/figma/book-open.jpg';
import arrowSm from '@/assets/figma/arrow-sm.svg';

interface Book {
  id: number;
  title: string;
  age: string;
  cover: string;
}

/* Eight slots, alternating the two cover shots the way the design does. */
const BOOKS: Book[] = [
  { id: 1, title: 'Kindness', age: '2-4 years', cover: bookClosed },
  { id: 2, title: 'Kindness', age: '2-4 years', cover: bookOpen },
  { id: 3, title: 'Kindness', age: '2-4 years', cover: bookClosed },
  { id: 4, title: 'Kindness', age: '2-4 years', cover: bookClosed },
  { id: 5, title: 'Kindness', age: '2-4 years', cover: bookClosed },
  { id: 6, title: 'Kindness', age: '2-4 years', cover: bookOpen },
  { id: 7, title: 'Kindness', age: '2-4 years', cover: bookClosed },
  { id: 8, title: 'Kindness', age: '2-4 years', cover: bookClosed },
];

export default function FeaturedBooks() {
  return (
    <section className="w-full bg-[#f9f6ef] py-16 lg:py-[100px]">
      <div className="mx-auto w-full max-w-[1280px] px-6 lg:px-0">
        {/* Heading */}
        <div className="flex flex-col items-center text-center">
          <p className="font-body text-[18px] font-medium uppercase leading-[32.4px] tracking-[2px] text-[#fe753b]">
            Featured Books
          </p>
          <h2 className="mt-[26px] font-heading text-[36px] font-extrabold leading-[1.1] tracking-[-1.44px] text-[#1a1a1a] sm:text-[48px] lg:text-[64px] lg:leading-[57.6px]">
            Books your child
            <br className="hidden lg:inline" />{' '}
            will actually finish
          </h2>
          <p className="mt-[26px] font-body text-[20px] font-semibold leading-[28px] text-[#4a5565]">
            Some of our most loved titles
          </p>
        </div>

        {/* Grid — 4 × 308px cards with an 18px gutter */}
        <div className="mt-[44px] grid grid-cols-2 gap-[18px] lg:grid-cols-4">
          {BOOKS.map((book) => (
            <Link
              key={book.id}
              to="/library"
              className="group flex flex-col overflow-hidden rounded-[16px] bg-white shadow-[0px_4px_6px_-4px_rgba(0,0,0,0.1)] transition-shadow hover:shadow-[0px_10px_20px_-6px_rgba(0,0,0,0.16)]"
            >
              <div className="relative h-[220px] overflow-hidden bg-[#279a92] lg:h-[320px]">
                {/* At the design width the cover sits at its native 329px and
                    bleeds past the card; narrower cards just fill instead. */}
                <img
                  src={book.cover}
                  alt={book.title}
                  className="h-full w-full object-cover lg:absolute lg:left-[1.83px] lg:top-[-9px] lg:h-[329px] lg:w-[329px] lg:max-w-none"
                />
              </div>
              <div className="flex flex-col gap-3 p-6">
                <h3 className="font-heading text-[18px] font-bold leading-7 text-[#0a0a0a]">
                  {book.title}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="rounded-[8px] bg-[#eceef2] px-[9px] py-[3px] font-body text-[12.545px] font-medium leading-[16.727px] text-[#030213]">
                    {book.age}
                  </span>
                  <span className="flex items-center gap-1 font-body text-[14px] font-medium leading-[17.6px] text-[#002b51]">
                    Borrow Now
                    <img
                      src={arrowSm}
                      alt=""
                      className="h-4 w-[15px] transition-transform group-hover:translate-x-1"
                    />
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
