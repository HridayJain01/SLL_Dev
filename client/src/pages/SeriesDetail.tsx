import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { IBook, ISeries } from '@/types';
import { useWishlistStore } from '@/store/wishlistStore';
import { Heart, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

type SortKey = 'default' | 'title-asc' | 'title-desc';

export default function SeriesDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [sort, setSort] = useState<SortKey>('default');

  const wishlist = useWishlistStore((s) => s.wishlist);
  const toggleWishlist = useWishlistStore((s) => s.toggle);

  const { data, isLoading } = useQuery({
    queryKey: ['series', slug],
    queryFn: async () => {
      const res = await api.get(`/series/${slug}`);
      return res.data as { series: ISeries; books: IBook[] };
    },
  });

  const books = useMemo(() => {
    const list = [...(data?.books ?? [])];
    if (sort === 'title-asc') list.sort((a, b) => a.title.localeCompare(b.title));
    if (sort === 'title-desc') list.sort((a, b) => b.title.localeCompare(a.title));
    return list;
  }, [data?.books, sort]);

  const handleWishlist = (id: string, title: string) => {
    toggleWishlist(id);
    const nowOn = !wishlist.includes(id);
    toast.success(nowOn ? `Saved "${title}" to your wishlist` : `Removed "${title}" from wishlist`);
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="h-5 w-1/3 bg-gray-100 rounded animate-pulse" />
        <div className="aspect-[16/7] w-full bg-gray-100 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-[4/3] bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data?.series) {
    return <div className="p-12 text-center text-red-500">Series not found</div>;
  }

  const series = data.series;
  const ageLabel = series.ageGroupMax
    ? `${series.ageGroupMin} to ${series.ageGroupMax} years`
    : 'All ages';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

      {/* Breadcrumb */}
      <nav className="mb-6 flex flex-wrap items-center gap-1 text-sm text-gray-400">
        <Link to="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to="/library" className="hover:text-primary">Library</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span>{ageLabel}</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <span>Series</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-semibold text-gray-700">{series.name}</span>
      </nav>

      {/* Cover hero */}
      {series.coverImage ? (
        <div className="overflow-hidden rounded-3xl shadow-sm">
          <img
            src={series.coverImage}
            alt={series.name}
            className="w-full max-h-[540px] object-cover"
          />
        </div>
      ) : (
        <div className="grid aspect-[16/7] w-full place-items-center rounded-3xl bg-accent text-2xl font-semibold text-white">
          Series Cover Image
        </div>
      )}

      {/* Optional description */}
      {series.description && (
        <p className="mt-6 max-w-3xl text-gray-600 leading-relaxed">{series.description}</p>
      )}

      {/* Toolbar */}
      <div className="mt-8 mb-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-gray-600">
          Books in this series: <span className="font-bold text-gray-900">{series.bookCount} Books</span>
        </p>
        <label className="relative inline-flex items-center">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="appearance-none rounded-full border border-gray-200 bg-white py-2 pl-4 pr-9 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="default">Sort: Default</option>
            <option value="title-asc">Title: A–Z</option>
            <option value="title-desc">Title: Z–A</option>
          </select>
          <ChevronRight className="pointer-events-none absolute right-3 h-4 w-4 rotate-90 text-gray-400" />
        </label>
      </div>

      {/* Books grid */}
      {books.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {books.map((book) => (
            <SeriesBookCard
              key={book._id}
              book={book}
              seriesName={series.name}
              wishlisted={wishlist.includes(book._id)}
              onWishlist={() => handleWishlist(book._id, book.title)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center text-gray-400">
          No books in this series yet.
        </div>
      )}
    </div>
  );
}

function SeriesBookCard({
  book, seriesName, wishlisted, onWishlist,
}: {
  book: IBook; seriesName: string; wishlisted: boolean; onWishlist: () => void;
}) {
  const badge = book.kind === 'puzzle' ? 'Puzzle' : book.series ? 'Series' : 'Book';
  const isAvailable = (book.availableCopies ?? 0) > 0;
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all">
      <Link to={`/library/${book._id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={book.coverImage || `https://placehold.co/400x300?text=${encodeURIComponent(book.title)}`}
            alt={book.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <span className="absolute top-3 left-3 rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            {badge}
          </span>
          {!isAvailable && (
            <span className="absolute bottom-0 left-0 right-0 bg-red-500/90 py-1 text-center text-[11px] font-bold text-white">
              Currently borrowed
            </span>
          )}
        </div>
      </Link>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/library/${book._id}`} className="min-w-0">
            <h3 className="font-heading font-bold text-gray-900 line-clamp-1">{book.title}</h3>
          </Link>
          <button
            onClick={onWishlist}
            aria-pressed={wishlisted}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            className="shrink-0 -mt-0.5"
          >
            <Heart className={`h-5 w-5 transition-colors ${wishlisted ? 'fill-primary text-primary' : 'text-gray-300 hover:text-primary'}`} />
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center rounded-full bg-chip-rose px-2.5 py-0.5 text-[11px] font-bold text-primary-dark">
            {book.ageGroupMin}–{book.ageGroupMax} yrs
          </span>
          {book.series?.index != null && (
            <span className="inline-flex items-center rounded-full bg-chip-indigo px-2.5 py-0.5 text-[11px] font-bold text-secondary-dark">
              {seriesName} #{book.series.index}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
