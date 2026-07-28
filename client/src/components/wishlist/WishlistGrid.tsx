import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import WishlistBookCard from '@/components/wishlist/WishlistBookCard';
import { useWishlistBooks } from '@/lib/useWishlistBooks';

/** The card grid shared by both wishlist screens (381:1143 and 385:2001). */
export default function WishlistGrid({ gap }: { gap: 'tight' | 'wide' }) {
  const { isLoading, books, onRemove, onAddToBox, isInBox } = useWishlistBooks();

  if (isLoading) {
    return <p className="font-body text-[14px] text-slate-label">Loading your wishlist…</p>;
  }

  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-[16px] border-2 border-dashed border-black/[0.07] bg-white/50 px-6 py-16 text-center">
        <span className="grid h-[56px] w-[56px] place-items-center rounded-full bg-chip-peach">
          <Heart className="h-[24px] w-[24px] text-primary" strokeWidth={1.5} />
        </span>
        <p className="font-heading text-[18px] font-bold text-night">Your wishlist is empty</p>
        <p className="max-w-[380px] font-jakarta text-[14px] leading-[20px] text-clay">
          Tap the heart on any title to save it here for your next box.
        </p>
        <Link
          to="/library"
          className="rounded-full border border-lagoon px-[16px] py-[8px] font-jakarta text-[12px] font-bold text-lagoon transition-colors hover:bg-lagoon/5"
        >
          Browse Library
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 ${
        gap === 'tight' ? 'gap-[12px]' : 'gap-[20px]'
      }`}
    >
      {books.map((book) => (
        <WishlistBookCard
          key={book._id}
          book={book}
          inBox={isInBox(book)}
          onRemove={() => onRemove(book)}
          onAddToBox={() => onAddToBox(book)}
        />
      ))}
    </div>
  );
}
