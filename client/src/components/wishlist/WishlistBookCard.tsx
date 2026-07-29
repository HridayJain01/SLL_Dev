import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { IBook, ICategory } from '@/types';

export type WishlistBookCardProps = {
  book: IBook;
  onRemove: () => void;
  onAddToBox: () => void;
  inBox: boolean;
};

function kindLabel(book: IBook) {
  if (book.kind === 'puzzle') return 'Puzzles';
  const category = book.categoryId as ICategory | string;
  if (category && typeof category === 'object' && category.name) return category.name;
  return 'Stories';
}

/**
 * Wishlist grid card — Figma nodes 381:1145 (account) and 385:1980 (nav icon).
 * Square cover with the kind badge and remove button, then title, chips and the
 * "Add to Box" pill.
 */
export default function WishlistBookCard({
  book,
  onRemove,
  onAddToBox,
  inBox,
}: WishlistBookCardProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-[14.545px] bg-white shadow-[0px_3.636px_5.455px_-3.636px_rgba(0,0,0,0.1)]">
      <div className="relative aspect-square w-full overflow-hidden bg-[#279a92]">
        <Link to={`/library/${book._id}`}>
          {book.coverImage && (
            <img
              src={book.coverImage}
              alt={book.title}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          )}
        </Link>

        <span className="absolute left-[9px] top-[24px] rounded-full bg-periwinkle px-[9px] py-[2px] font-body text-[9px] font-semibold uppercase leading-[13.6px] tracking-[0.73px] text-white">
          {kindLabel(book)}
        </span>

        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${book.title} from wishlist`}
          className="absolute right-[9px] top-[24px] grid h-[34px] w-[34px] place-items-center rounded-full border border-[#e5e7eb] bg-white text-night transition-colors hover:bg-chip-peach hover:text-primary sm:h-[27px] sm:w-[27px]"
        >
          {/* 27px button, 11px mark — the exported icon (381:1154) is a 19.09px
              box whose inner vector sits at a 20.83% inset. */}
          <X className="h-[11px] w-[11px]" strokeWidth={1.8} />
        </button>
      </div>

      {/* Two per row on phones leaves ~70px beside the title, so the action
          drops below the text until there is room for it alongside. */}
      <div className="flex flex-1 flex-col items-stretch gap-[10px] px-[9px] pb-[17px] pt-[15px] sm:flex-row sm:items-end sm:justify-between sm:gap-[8px]">
        <div className="min-w-0">
          <Link
            to={`/library/${book._id}`}
            className="block truncate font-heading text-[16.364px] font-bold leading-[25.455px] text-[#0a0a0a] hover:text-primary"
          >
            {book.title}
          </Link>
          <div className="mt-[8px] flex flex-wrap items-center gap-[7px]">
            <span className="whitespace-nowrap rounded-full bg-chip-peach px-[9px] py-[2px] font-body text-[9px] font-semibold leading-[13.6px] text-primary">
              {book.ageGroupMin}–{book.ageGroupMax} yrs
            </span>
            {typeof book.numPages === 'number' && book.numPages > 0 && (
              <span className="whitespace-nowrap rounded-full bg-chip-peach px-[6px] py-[2px] font-body text-[9px] font-semibold leading-[13.6px] text-primary">
                {book.numPages} Pages
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onAddToBox}
          disabled={inBox}
          className="mt-auto shrink-0 rounded-full bg-primary px-[7px] py-[7px] font-body text-[10px] font-semibold leading-[15.5px] text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-primary/50 sm:py-[2px]"
        >
          {inBox ? 'In Box' : 'Add to Box'}
        </button>
      </div>
    </div>
  );
}
