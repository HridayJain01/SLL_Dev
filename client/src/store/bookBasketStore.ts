import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IBook } from '@/types';

interface BookBasketState {
  selectedBooks: IBook[];
  addBook: (book: IBook) => void;
  removeBook: (bookId: string) => void;
  clearBooks: () => void;
}

export const useBookBasketStore = create<BookBasketState>()(
  persist(
    (set, get) => ({
      selectedBooks: [],
      addBook: (book) => {
        const alreadySelected = get().selectedBooks.some((selectedBook) => selectedBook._id === book._id);
        if (alreadySelected) return;

        set((state) => ({ selectedBooks: [...state.selectedBooks, book] }));
      },
      removeBook: (bookId) => {
        set((state) => ({ selectedBooks: state.selectedBooks.filter((book) => book._id !== bookId) }));
      },
      clearBooks: () => set({ selectedBooks: [] }),
    }),
    { name: 'book-basket-storage' }
  )
);