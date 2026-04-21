import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { IBook } from '@/types';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

export default function FeaturedBooks() {
  const { data, isLoading } = useQuery({
    queryKey: ['featured-books'],
    queryFn: async () => {
      const res = await api.get('/books?limit=6');
      return res.data.books as IBook[];
    },
  });

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-heading font-bold text-gray-900 mb-2">Featured Reads</h2>
            <p className="text-gray-600">Handpicked favorites for young readers.</p>
          </div>
          <Link to="/library" className="hidden sm:flex text-primary hover:text-primary-dark font-medium items-center">
            View All <BookOpen className="ml-2 h-4 w-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-200 rounded-xl aspect-[2/3] w-full" />
            ))}
          </div>
        ) : (
          <div className="flex overflow-x-auto space-x-6 pb-8 snap-x">
            {data?.map((book) => (
              <Link
                key={book._id}
                to={`/library/${book._id}`}
                className="flex-none w-48 sm:w-56 group snap-start"
              >
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-md mb-4 group-hover:shadow-xl transition-shadow">
                  <img
                    src={book.coverImage || `https://placehold.co/300x400?text=${encodeURIComponent(book.title)}`}
                    alt={book.title}
                    className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 bg-white/90 backdrop-blur text-xs font-bold px-2 py-1 rounded-md">
                    {book.ageGroupMin}-{book.ageGroupMax} yrs
                  </div>
                </div>
                <h3 className="font-heading font-bold text-gray-900 truncate">{book.title}</h3>
                <p className="text-sm text-gray-500 truncate">
                  {typeof book.categoryId === 'object' ? book.categoryId.name : 'Book'}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
