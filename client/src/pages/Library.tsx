import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { IBook, ICategory } from '@/types';
import { Link } from 'react-router-dom';
import { Search, Filter, Plus, CheckCircle2 } from 'lucide-react';
import { useBookBasketStore } from '@/store/bookBasketStore';
import { toast } from 'sonner';

export default function Library() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const selectedBooks = useBookBasketStore((s) => s.selectedBooks);
  const addBook = useBookBasketStore((s) => s.addBook);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data.categories as ICategory[];
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['books', search, category],
    queryFn: async () => {
      const res = await api.get('/books', {
        params: { search, category, limit: 12 },
      });
      return res.data;
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 space-y-4 md:space-y-0">
        <h1 className="text-3xl font-heading font-bold text-gray-900">Library</h1>
        
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search books..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-full w-full focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="pl-10 pr-8 py-2 border rounded-full w-full appearance-none focus:ring-2 focus:ring-primary outline-none bg-white"
            >
              <option value="">All Categories</option>
              {categories?.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 rounded-xl aspect-[2/3] w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {data?.books.map((book: IBook) => (
            <div key={book._id} className="group flex h-full flex-col">
              <Link to={`/library/${book._id}`}>
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-sm mb-4 border group-hover:shadow-lg transition-all">
                  <img
                    src={book.coverImage || `https://placehold.co/300x400?text=${encodeURIComponent(book.title)}`}
                    alt={book.title}
                    className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 bg-white/90 backdrop-blur text-xs font-bold px-2 py-1 rounded-md">
                    {book.ageGroupMin}-{book.ageGroupMax} yrs
                  </div>
                  {book.planAccess.includes('PREMIUM') && !book.planAccess.includes('NORMAL') && (
                    <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-md">
                      PREMIUM
                    </div>
                  )}
                  <div className={`absolute bottom-0 left-0 w-full text-center text-xs font-bold py-1 ${book.availableCopies! > 0 ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'}`}>
                    {book.availableCopies! > 0 ? 'Available' : 'Currently Borrowed'}
                  </div>
                </div>
                <h3 className="font-heading font-bold text-gray-900 line-clamp-1">{book.title}</h3>
                <p className="text-sm text-gray-500">
                  {typeof book.categoryId === 'object' ? book.categoryId.name : ''}
                </p>
              </Link>

              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => {
                    addBook(book);
                    toast.success(selectedBooks.some((item) => item._id === book._id) ? 'Already in your order list' : 'Added to your order list');
                  }}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-primary/20 px-3 py-2 text-sm font-medium text-primary hover:border-primary"
                >
                  {selectedBooks.some((item) => item._id === book._id) ? <CheckCircle2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {selectedBooks.some((item) => item._id === book._id) ? 'Saved' : 'Add to list'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {!isLoading && data?.books.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">No books found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}
