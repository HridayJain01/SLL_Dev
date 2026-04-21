import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { IBook } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { Check, Info } from 'lucide-react';

export default function BookDetails() {
  const { bookId } = useParams<{ bookId: string }>();
  const user = useAuthStore((s) => s.user);

  const { data, isLoading } = useQuery({
    queryKey: ['book', bookId],
    queryFn: async () => {
      const res = await api.get(`/books/${bookId}`);
      return res.data;
    },
  });

  if (isLoading) return <div className="p-12 text-center">Loading...</div>;
  if (!data?.book) return <div className="p-12 text-center text-danger">Book not found</div>;

  const book: IBook = data.book;
  const isAvailable = book.availableCopies! > 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-10 flex flex-col md:flex-row gap-10">
        <div className="w-full md:w-1/3 flex-shrink-0">
          <img
            src={book.coverImage || `https://placehold.co/300x400?text=${encodeURIComponent(book.title)}`}
            alt={book.title}
            className="w-full rounded-xl shadow-md"
          />
        </div>
        
        <div className="flex-1">
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="bg-gray-100 text-gray-800 text-xs font-bold px-3 py-1 rounded-full">
              {book.ageGroupMin}-{book.ageGroupMax} yrs
            </span>
            <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
              {typeof book.categoryId === 'object' ? book.categoryId.name : ''}
            </span>
            {book.planAccess.includes('PREMIUM') && !book.planAccess.includes('NORMAL') && (
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full">
                Premium Plan Only
              </span>
            )}
          </div>
          
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-6">{book.title}</h1>
          <p className="text-gray-600 text-lg leading-relaxed mb-8">{book.description}</p>
          
          <div className="flex items-center gap-2 mb-8">
            <div className={`flex items-center px-4 py-2 rounded-lg font-medium ${isAvailable ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {isAvailable ? <Check className="w-5 h-5 mr-2" /> : <Info className="w-5 h-5 mr-2" />}
              {isAvailable ? `${book.availableCopies} Copies Available` : 'Currently Borrowed Out'}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              disabled={!user || !isAvailable}
              className="flex-1 bg-primary hover:bg-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors"
            >
              {!user ? 'Log in to Borrow' : isAvailable ? 'Request to Borrow' : 'Unavailable'}
            </button>
            {user && (
              <button className="px-6 py-3 border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-bold rounded-xl transition-colors">
                Add to Preferences
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
