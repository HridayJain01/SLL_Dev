import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { IBook } from '@/types';
import arrowSm from '@/assets/figma/arrow-sm.svg';

/* Eight newest catalogue titles. Covers come from each book's gallery, which
   admins manage in the book edit form. */
const FEATURED_COUNT = 8;

const coverSrc = (book: IBook) =>
  book.coverImage ||
  book.images?.[0]?.url ||
  `https://placehold.co/400x300?text=${encodeURIComponent(book.title)}`;

export default function FeaturedBooks() {
  const { data: books, isLoading } = useQuery({
    queryKey: ['featured-books', FEATURED_COUNT],
    queryFn: async () => {
      const res = await api.get('/books', { params: { limit: FEATURED_COUNT, sort: 'newest' } });
      return res.data.books as IBook[];
    },
  });

  // Nothing to show once loading finishes and the catalogue is empty — drop the
  // whole section rather than render an empty grid.
  if (!isLoading && !books?.length) return null;

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
          {isLoading &&
            Array.from({ length: FEATURED_COUNT }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="flex flex-col overflow-hidden rounded-[16px] bg-white shadow-[0px_4px_6px_-4px_rgba(0,0,0,0.1)]"
              >
                <div className="h-[220px] animate-pulse bg-gray-200 lg:h-[320px]" />
                <div className="flex flex-col gap-3 p-6">
                  <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />
                  <div className="h-5 w-1/2 animate-pulse rounded bg-gray-100" />
                </div>
              </div>
            ))}

          {books?.map((book) => (
            <Link
              key={book._id}
              to={`/library/${book._id}`}
              className="group flex flex-col overflow-hidden rounded-[16px] bg-white shadow-[0px_4px_6px_-4px_rgba(0,0,0,0.1)] transition-shadow hover:shadow-[0px_10px_20px_-6px_rgba(0,0,0,0.16)]"
            >
              <div className="relative h-[220px] overflow-hidden bg-[#279a92] lg:h-[320px]">
                {/* At the design width the cover sits at its native 329px and
                    bleeds past the card; narrower cards just fill instead. */}
                <img
                  src={coverSrc(book)}
                  alt={book.title}
                  loading="lazy"
                  className="h-full w-full object-cover lg:absolute lg:left-[1.83px] lg:top-[-9px] lg:h-[329px] lg:w-[329px] lg:max-w-none"
                />
              </div>
              <div className="flex flex-col gap-3 p-6">
                <h3 className="line-clamp-1 font-heading text-[18px] font-bold leading-7 text-[#0a0a0a]">
                  {book.title}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="rounded-[8px] bg-[#eceef2] px-[9px] py-[3px] font-body text-[12.545px] font-medium leading-[16.727px] text-[#030213]">
                    {book.ageGroupMin}-{book.ageGroupMax} years
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
