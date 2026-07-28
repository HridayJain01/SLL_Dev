import { useQueries } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { IBook } from '@/types';
import { useWishlistStore } from '@/store/wishlistStore';
import { useBookBasketStore } from '@/store/bookBasketStore';

/**
 * Resolves the wishlist (which persists ids only) into full books, and supplies
 * the two card actions used by both wishlist screens (381:1088, 385:1978).
 */
export function useWishlistBooks() {
  const wishlist = useWishlistStore((s) => s.wishlist);
  const toggle = useWishlistStore((s) => s.toggle);
  const selectedBooks = useBookBasketStore((s) => s.selectedBooks);
  const addBook = useBookBasketStore((s) => s.addBook);

  const queries = useQueries({
    queries: wishlist.map((id) => ({
      queryKey: ['book', id],
      queryFn: async () => {
        const res = await api.get(`/books/${id}`);
        return res.data.book as IBook;
      },
      staleTime: 5 * 60 * 1000,
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);
  const books = queries
    .map((q) => q.data)
    .filter((book): book is IBook => Boolean(book));

  const onRemove = (book: IBook) => {
    toggle(book._id);
    toast.success(`Removed "${book.title}" from your wishlist`);
  };

  const onAddToBox = (book: IBook) => {
    addBook(book);
    toast.success(`Added "${book.title}" to your box`);
  };

  return {
    isLoading,
    books,
    /** Total saved items, including any that failed to resolve. */
    count: wishlist.length,
    isInBox: (book: IBook) => selectedBooks.some((b) => b._id === book._id),
    onRemove,
    onAddToBox,
  };
}
