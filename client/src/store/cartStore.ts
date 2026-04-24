import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IBook } from '@/types';

interface CartState {
  cartBooks: IBook[];
  addToCart: (book: IBook) => void;
  removeFromCart: (bookId: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cartBooks: [],
      addToCart: (book) => {
        const alreadyInCart = get().cartBooks.some((cartBook) => cartBook._id === book._id);
        if (alreadyInCart) return;

        set((state) => ({ cartBooks: [...state.cartBooks, book] }));
      },
      removeFromCart: (bookId) => {
        set((state) => ({ cartBooks: state.cartBooks.filter((book) => book._id !== bookId) }));
      },
      clearCart: () => set({ cartBooks: [] }),
    }),
    { name: 'cart-storage' }
  )
);
