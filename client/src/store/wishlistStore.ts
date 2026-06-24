import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WishlistState {
  /** Set of book ids the user has hearted. */
  wishlist: string[];
  toggle: (bookId: string) => void;
  isWishlisted: (bookId: string) => boolean;
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      wishlist: [],
      toggle: (bookId) => {
        const exists = get().wishlist.includes(bookId);
        set((state) => ({
          wishlist: exists
            ? state.wishlist.filter((id) => id !== bookId)
            : [...state.wishlist, bookId],
        }));
      },
      isWishlisted: (bookId) => get().wishlist.includes(bookId),
      clear: () => set({ wishlist: [] }),
    }),
    { name: 'book-wishlist-storage' }
  )
);
