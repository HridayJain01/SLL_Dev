import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';

interface WishlistState {
  /** Set of book ids the user has hearted. */
  wishlist: string[];
  /** Returns false (and tells the user why) when a guest tries to add. */
  toggle: (bookId: string) => boolean;
  isWishlisted: (bookId: string) => boolean;
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      wishlist: [],
      toggle: (bookId) => {
        const exists = get().wishlist.includes(bookId);
        if (!exists && !useAuthStore.getState().user) {
          toast.error('You have to be logged in to add to your wishlist');
          return false;
        }
        set((state) => ({
          wishlist: exists
            ? state.wishlist.filter((id) => id !== bookId)
            : [...state.wishlist, bookId],
        }));
        return true;
      },
      isWishlisted: (bookId) => get().wishlist.includes(bookId),
      clear: () => set({ wishlist: [] }),
    }),
    { name: 'book-wishlist-storage' }
  )
);
