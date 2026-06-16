import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { IBook } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useBookBasketStore } from '@/store/bookBasketStore';
import { Check, Info, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';

export default function BookDetails() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const selectedBooks = useBookBasketStore((s) => s.selectedBooks);
  const addBook = useBookBasketStore((s) => s.addBook);
  const removeBook = useBookBasketStore((s) => s.removeBook);

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
  const similarBooks = data.similarBooks as IBook[] | undefined;
  const availableCopies = book.availableCopies ?? 0;
  const isAvailable = availableCopies > 0;
  const inBasket = selectedBooks.some((selectedBook) => selectedBook._id === book._id);

  const toggleBasket = () => {
    if (!user) {
      toast.error('Please log in to save preferences');
      navigate('/login');
      return;
    }

    if (inBasket) {
      removeBook(book._id);
      toast.success('Removed from preference list');
      return;
    }

    addBook(book);
    toast.success('Added to preference list');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-10 flex flex-col md:flex-row gap-10">
        <div className="w-full md:w-1/3 flex-shrink-0">
          <img
            src={book.coverImage || `https://placehold.co/300x400?text=${encodeURIComponent(book.title)}`}
            alt={book.title}
            className="w-full rounded-xl shadow-md"
          />
          {book.images && book.images.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {book.images.map((img, i) => (
                <img key={i} src={img} alt={`${book.title} ${i + 1}`} className="aspect-square w-full rounded-lg object-cover border border-gray-100" />
              ))}
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="bg-gray-100 text-gray-800 text-xs font-bold px-3 py-1 rounded-full">
              {book.ageGroupMin}-{book.ageGroupMax} yrs
            </span>
            <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
              {typeof book.categoryId === 'object' ? book.categoryId.name : ''}
            </span>
            {book.kind === 'puzzle' && (
              <span className="bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full">Puzzle</span>
            )}
            {book.planAccess.includes('PREMIUM') && !book.planAccess.includes('NORMAL') && (
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full">
                Premium Plan Only
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-2">{book.title}</h1>
          {book.series && (
            <p className="text-primary font-medium mb-4">{book.series.name} · Book {book.series.index}</p>
          )}
          <p className="text-gray-600 text-lg leading-relaxed mb-6">{book.description}</p>

          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 mb-8 border-y border-gray-100 py-5">
            <Spec label="Shelf code" value={book.shelfCode} mono />
            <Spec label="Author" value={book.author || undefined} />
            <Spec label="Pages" value={book.numPages} />
            <Spec label="Cover" value={book.coverType} />
            <Spec label="Reading age" value={book.readingAge} />
            <Spec label="Reading level" value={book.readingLevel} />
            {book.kind === 'puzzle' && <Spec label="Pieces" value={book.pieceCount} />}
            {book.kind === 'puzzle' && <Spec label="Material" value={book.material} />}
          </dl>

          {book.keywords && book.keywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {book.keywords.map((k, i) => (
                <span key={i} className="bg-gray-50 border border-gray-200 text-gray-600 text-xs px-2.5 py-1 rounded-full">{k}</span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 mb-8">
            <div className={`flex items-center px-4 py-2 rounded-lg font-medium ${isAvailable ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {isAvailable ? <Check className="w-5 h-5 mr-2" /> : <Info className="w-5 h-5 mr-2" />}
              {isAvailable ? `${availableCopies} Copies Available` : 'Currently Borrowed Out'}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={toggleBasket}
              className="flex-1 flex items-center justify-center gap-2 border-2 border-primary/20 hover:border-primary text-primary font-bold py-3 rounded-xl transition-colors"
            >
              {inBasket ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {inBasket ? 'Remove from Preference List' : 'Add to Preference List'}
            </button>
            <button
              onClick={() => navigate('/dashboard/preferences')}
              disabled={!user || !isAvailable}
              className="flex-1 bg-primary hover:bg-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors"
            >
              {!user ? 'Log in to continue' : isAvailable ? 'Go to Basket' : 'Unavailable'}
            </button>
          </div>

          <p className="mt-3 text-sm text-gray-500">
            Orders are placed only from your basket. Add preferred books first, then place one combined order.
          </p>
        </div>
      </div>

      {similarBooks && similarBooks.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">Similar Books</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {similarBooks.map((similarBook) => (
              <Link key={similarBook._id} to={`/library/${similarBook._id}`} className="group rounded-xl border border-gray-100 bg-white p-3 shadow-sm hover:shadow-md transition-all">
                <img
                  src={similarBook.coverImage || `https://placehold.co/300x400?text=${encodeURIComponent(similarBook.title)}`}
                  alt={similarBook.title}
                  className="aspect-[2/3] w-full rounded-lg object-cover mb-3"
                />
                <h3 className="font-semibold text-gray-900 line-clamp-1">{similarBook.title}</h3>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Spec({ label, value, mono }: { label: string; value?: string | number | null; mono?: boolean }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className={`text-gray-800 font-medium ${mono ? 'font-mono text-sm' : ''}`}>{value}</dd>
    </div>
  );
}
