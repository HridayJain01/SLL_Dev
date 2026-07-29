import { Trash2, Heart } from 'lucide-react';
import { IBook } from '@/types';

/** Rotating cover tints from the design (383:1624 / 383:1650 / 383:1676). */
const COVER_TINTS = ['bg-[#fdecc8]', 'bg-[#d4eef7]', 'bg-[#d9f0e8]'];

export type BoxBookCardProps = {
  book: IBook;
  index: number;
  onRemove: () => void;
  onMoveToWishlist: () => void;
};

/**
 * A single row in "Books in your box" — Figma node 383:1623 / 385:2532.
 * 106px tall, 16px radius, 56×72 cover, age badge, and the two text actions.
 */
export default function BoxBookCard({ book, index, onRemove, onMoveToWishlist }: BoxBookCardProps) {
  return (
    /* Below sm the two actions wrap onto their own row so a long title still
       gets usable width on a 320–375px screen. */
    <div className="flex min-h-[106px] flex-wrap items-center gap-x-[16px] gap-y-[10px] rounded-[16px] border border-black/[0.07] bg-white p-[14px] drop-shadow-[0px_1px_1.5px_rgba(0,0,0,0.1)] sm:h-[106px] sm:flex-nowrap sm:p-[17px]">
      <div
        className={`h-[72px] w-[56px] shrink-0 overflow-hidden rounded-[14px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] ${
          COVER_TINTS[index % COVER_TINTS.length]
        }`}
      >
        {book.coverImage && (
          <img src={book.coverImage} alt={book.title} className="h-[72px] w-full object-cover" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-jakarta text-[14px] font-bold leading-[17.5px] text-night">
          {book.title}
        </p>
        {book.author && (
          <p className="mt-[2px] truncate font-jakarta text-[12px] leading-[16px] text-clay">
            by {book.author}
          </p>
        )}
        <div className="mt-[6px] flex h-[24px] items-center">
          <span className="rounded-full bg-chip-peach px-[8px] py-[2px] font-jakarta text-[10px] font-bold leading-[15px] text-primary">
            Ages {book.ageGroupMin}–{book.ageGroupMax}
          </span>
        </div>
      </div>

      <div className="flex w-full shrink-0 items-center gap-[18px] border-t border-black/[0.05] pt-[10px] sm:w-auto sm:flex-col sm:items-end sm:gap-[6px] sm:border-t-0 sm:pt-0">
        <button
          type="button"
          onClick={onRemove}
          className="flex items-center gap-[4px] whitespace-nowrap py-[4px] font-jakarta text-[11px] font-semibold leading-[16.5px] text-coral transition-opacity hover:opacity-80 sm:py-0"
        >
          <Trash2 className="h-[11px] w-[11px]" strokeWidth={1.5} />
          Remove
        </button>
        <button
          type="button"
          onClick={onMoveToWishlist}
          className="flex items-center gap-[4px] whitespace-nowrap py-[4px] font-jakarta text-[11px] font-semibold leading-[16.5px] text-lagoon transition-opacity hover:opacity-80 sm:py-0"
        >
          <Heart className="h-[11px] w-[11px]" strokeWidth={1.5} />
          Move to Wishlist
        </button>
      </div>
    </div>
  );
}
