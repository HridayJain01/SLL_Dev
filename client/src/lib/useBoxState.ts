import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { IBook, IMembership } from '@/types';
import { getMembershipAllowance, PLAN_DEFINITIONS } from '@/lib/plans';
import { useBookBasketStore } from '@/store/bookBasketStore';
import { useWishlistStore } from '@/store/wishlistStore';

/**
 * Shared state for the My Box (383:1601) and Cart (385:2348) screens: the
 * selected titles split by kind, the plan allowance, and the row actions.
 */
export function useBoxState() {
  const selectedBooks = useBookBasketStore((s) => s.selectedBooks);
  const removeBook = useBookBasketStore((s) => s.removeBook);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const wishlist = useWishlistStore((s) => s.wishlist);

  const { data: membership, isLoading } = useQuery({
    queryKey: ['membership', 'me'],
    queryFn: async () => {
      const res = await api.get('/memberships/me');
      return res.data.membership as IMembership | null;
    },
  });

  const books = useMemo(() => selectedBooks.filter((b) => b.kind !== 'puzzle'), [selectedBooks]);
  const puzzles = useMemo(() => selectedBooks.filter((b) => b.kind === 'puzzle'), [selectedBooks]);

  const allowance = getMembershipAllowance(membership ?? null);
  // Fall back to the entry plan when the visitor has no membership yet, so the
  // summary card still reads like the design instead of showing "0 of 0".
  const fallback = PLAN_DEFINITIONS.LITTLE_READER;
  const planLabel = membership ? allowance.label : fallback.label;
  const bookLimit =
    (membership
      ? allowance.monthlyTotalLimit || allowance.monthlyBookLimit
      : fallback.monthlyBookLimit) ?? 0;
  const puzzleLimit = membership ? allowance.monthlyPuzzleLimit : fallback.monthlyPuzzleLimit ?? 0;

  const planSubtitle = puzzleLimit
    ? `${bookLimit} books + ${puzzleLimit} puzzles / month`
    : `${bookLimit} books / month`;

  const slotsRemaining = Math.max(0, bookLimit - books.length - puzzles.length);

  const onRemove = (book: IBook) => {
    removeBook(book._id);
    toast.success(`${book.title} removed from your box`);
  };

  const onMoveToWishlist = (book: IBook) => {
    if (!wishlist.includes(book._id)) toggleWishlist(book._id);
    removeBook(book._id);
    toast.success(`${book.title} moved to your wishlist`);
  };

  return {
    isLoading,
    books,
    puzzles,
    booksSelected: books.length + puzzles.length,
    bookLimit,
    slotsRemaining,
    planLabel,
    planSubtitle,
    onRemove,
    onMoveToWishlist,
  };
}
