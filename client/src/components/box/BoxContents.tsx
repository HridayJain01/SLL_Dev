import { Link } from 'react-router-dom';
import { Puzzle, Plus, BookOpen } from 'lucide-react';
import { IBook } from '@/types';
import { cn } from '@/lib/utils';
import BoxBookCard from '@/components/box/BoxBookCard';

export type BoxContentsProps = {
  books: IBook[];
  puzzles: IBook[];
  slotsRemaining: number;
  onRemove: (book: IBook) => void;
  onMoveToWishlist: (book: IBook) => void;
  /** "box" = My Box frame (383:1615); "cart" = Cart frame (385:2529). */
  variant?: 'box' | 'cart';
};

function SectionHeading({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: 'box' | 'cart';
}) {
  return (
    <h2
      className={cn(
        'font-jakarta font-bold',
        variant === 'cart'
          ? 'text-[20px] leading-[20px] text-black'
          : 'text-[14px] leading-[20px] text-night'
      )}
    >
      {children}
    </h2>
  );
}

function CountBadge({
  children,
  tone,
  variant,
}: {
  children: React.ReactNode;
  tone: 'indigo' | 'sand';
  variant: 'box' | 'cart';
}) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-jakarta text-[10px] font-bold leading-[15px]',
        variant === 'cart' ? 'h-[26px] px-[10px]' : 'px-[8px] py-[2px]',
        tone === 'indigo' ? 'bg-periwinkle text-white' : 'bg-sand text-clay'
      )}
    >
      {children}
    </span>
  );
}

/** Dashed placeholder row — Figma nodes 383:1709 (puzzle) and 383:1728 (slot). */
function DashedRow({
  icon,
  title,
  subtitle,
  padding,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  /** sm+ padding override; the base 14px padding is set on the row itself. */
  padding: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-[16px] gap-y-[12px] rounded-[16px] border-2 border-dashed border-black/[0.07] bg-white/50 p-[14px] sm:flex-nowrap',
        padding
      )}
    >
      <div className="grid h-[72px] w-[56px] shrink-0 place-items-center rounded-[14px] bg-sand">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-jakarta text-[14px] font-semibold leading-[20px] text-clay">{title}</p>
        {subtitle && (
          <p className="mt-[2px] font-jakarta text-[12px] leading-[16px] text-clay/70">{subtitle}</p>
        )}
      </div>
      <Link
        to="/library"
        className="shrink-0 rounded-full border border-lagoon px-[13px] py-[7px] font-jakarta text-[12px] font-bold leading-[16px] text-lagoon transition-colors hover:bg-lagoon/5"
      >
        Browse Library
      </Link>
    </div>
  );
}

/**
 * "Books in your box" / "Puzzles in your box" / remaining slots — the shared
 * body of the My Box (383:1601) and Cart (385:2348) screens.
 */
export default function BoxContents({
  books,
  puzzles,
  slotsRemaining,
  onRemove,
  onMoveToWishlist,
  variant = 'box',
}: BoxContentsProps) {
  return (
    <div className="w-full max-w-[575px]">
      {/* Books */}
      <section>
        <div className="flex items-center gap-[10px]">
          <SectionHeading variant={variant}>Books in your box</SectionHeading>
          <CountBadge tone="indigo" variant={variant}>
            {books.length} {books.length === 1 ? 'Book' : 'Books'}
          </CountBadge>
        </div>

        <div className="flex flex-col gap-[12px] pt-[12px]">
          {books.length === 0 ? (
            <DashedRow
              icon={<BookOpen className="h-[22px] w-[22px] text-clay" strokeWidth={1.5} />}
              title="No books added yet"
              subtitle="Pick your first title from the library"
              padding="sm:p-[18px]"
            />
          ) : (
            books.map((book, index) => (
              <BoxBookCard
                key={book._id}
                book={book}
                index={index}
                onRemove={() => onRemove(book)}
                onMoveToWishlist={() => onMoveToWishlist(book)}
              />
            ))
          )}
        </div>
      </section>

      {/* Puzzles */}
      <section className="pt-[28px]">
        <div className="flex items-center gap-[10px]">
          {variant === 'box' && (
            <Puzzle className="h-[16px] w-[16px] shrink-0 text-clay" strokeWidth={1.2} />
          )}
          <SectionHeading variant={variant}>Puzzles in your box</SectionHeading>
          <CountBadge tone={variant === 'cart' ? 'indigo' : 'sand'} variant={variant}>
            {puzzles.length} {puzzles.length === 1 ? 'Puzzle' : 'Puzzles'}
          </CountBadge>
        </div>

        <div className="flex flex-col gap-[12px] pt-[12px]">
          {puzzles.length === 0 ? (
            <DashedRow
              icon={<Puzzle className="h-[22px] w-[22px] text-clay" strokeWidth={1.5} />}
              title="No puzzle added yet"
              subtitle="Add a fun puzzle to complement your books"
              padding="sm:p-[22px]"
            />
          ) : (
            puzzles.map((puzzle, index) => (
              <BoxBookCard
                key={puzzle._id}
                book={puzzle}
                index={index}
                onRemove={() => onRemove(puzzle)}
                onMoveToWishlist={() => onMoveToWishlist(puzzle)}
              />
            ))
          )}
        </div>
      </section>

      {/* Remaining slots */}
      {slotsRemaining > 0 && (
        <section className="pt-[28px]">
          <div className="flex items-center gap-[10px]">
            <Plus className="h-[16px] w-[16px] shrink-0 text-clay" strokeWidth={1.2} />
            <SectionHeading variant="box">
              {slotsRemaining} {slotsRemaining === 1 ? 'slot' : 'slots'} remaining
            </SectionHeading>
          </div>

          <div className="flex flex-col gap-[12px] pt-[12px]">
            {Array.from({ length: slotsRemaining }).map((_, index) => (
              <DashedRow
                key={index}
                icon={<BookOpen className="h-[22px] w-[22px] text-clay" strokeWidth={1.5} />}
                title="Add another book"
                padding="sm:p-[18px]"
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
