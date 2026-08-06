import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { IBook } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useBookBasketStore } from '@/store/bookBasketStore';
import { useWishlistStore } from '@/store/wishlistStore';
import {
  Check, BookOpen, ShoppingBasket, Plus, Minus, Heart, ZoomIn,
  FileText, Palette, Star, X, ChevronLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { getPlanLabel, normalizePlanAccess } from '@/lib/plans';

export default function BookDetails() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const selectedBooks = useBookBasketStore((s) => s.selectedBooks);
  const addBook = useBookBasketStore((s) => s.addBook);
  const removeBook = useBookBasketStore((s) => s.removeBook);

  const wishlist = useWishlistStore((s) => s.wishlist);
  const toggleWishlist = useWishlistStore((s) => s.toggle);

  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [zoomOpen, setZoomOpen] = useState(false);

  // Reset transient UI state whenever we navigate to a different book.
  useEffect(() => {
    setActiveImage(null);
    setQty(1);
    setZoomOpen(false);
  }, [bookId]);

  const { data, isLoading } = useQuery({
    // Distinct from ['book', id] (a bare IBook) — this caches the whole
    // { book, similarBooks, seriesBooks } envelope.
    queryKey: ['book-details', bookId],
    queryFn: async () => {
      const res = await api.get(`/books/${bookId}`);
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-6">
        <div className="bg-white rounded-3xl border p-10 flex flex-col md:flex-row gap-10">
          <div className="w-full md:w-[440px] aspect-square bg-gray-100 rounded-2xl animate-pulse" />
          <div className="flex-1 space-y-4">
            <div className="h-10 bg-gray-100 rounded animate-pulse w-3/4" />
            <div className="h-5 bg-gray-100 rounded animate-pulse w-1/2" />
            <div className="h-24 bg-gray-100 rounded animate-pulse" />
            <div className="h-12 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!data?.book) {
    return <div className="p-12 text-center text-red-500">Book not found</div>;
  }

  const book: IBook = data.book;
  const similarBooks = data.similarBooks as IBook[] | undefined;
  const seriesBooks = data.seriesBooks as IBook[] | undefined;
  const availableCopies = book.availableCopies ?? 0;
  const isAvailable = availableCopies > 0;
  const inBasket = selectedBooks.some((b) => b._id === book._id);
  const isWishlisted = wishlist.includes(book._id);
  const maxQty = Math.max(1, availableCopies);

  // Build the gallery: prefer explicit images, fall back to the cover.
  const gallery = (book.images && book.images.length > 0)
    ? book.images.map((img) => img.url)
    : book.coverImage ? [book.coverImage] : [];
  const placeholder = `https://placehold.co/600x600?text=${encodeURIComponent(book.title)}`;
  const mainImage = activeImage || gallery[0] || placeholder;

  const categoryName =
    typeof book.categoryId === 'object' && book.categoryId?.name ? book.categoryId.name : null;
  const coverLabel = book.coverType === 'Hardcover' ? 'Hard' : book.coverType === 'Softcover' ? 'Soft' : '—';
  const planAccess = normalizePlanAccess(book.planAccess, book.kind ?? 'book');
  const restrictedPlanLabels = planAccess.filter((plan) => plan !== 'LITTLE_READER').map((plan) => getPlanLabel(plan));

  const handleAddToBox = () => {
    if (!user) {
      toast.error('Please log in to add books to your box');
      navigate('/login');
      return;
    }
    if (!isAvailable) {
      toast.error('This title is currently borrowed out');
      return;
    }
    if (inBasket) {
      removeBook(book._id);
      toast.success('Removed from your box');
    } else {
      addBook(book);
      toast.success(qty > 1 ? `Added to your box (×${qty} requested)` : 'Added to your box');
    }
  };

  // Prefer the browser history entry (it carries the Library's filtered URL),
  // but fall back to the Library when the user landed here directly.
  const goBack = () => {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate('/library');
  };

  const handleWishlist = (id: string, title: string) => {
    toggleWishlist(id);
    const nowOn = !wishlist.includes(id);
    toast.success(nowOn ? `Saved "${title}" to your wishlist` : `Removed "${title}" from wishlist`);
  };

  const hasSeriesSection = book.series && seriesBooks && seriesBooks.length > 1;
  const seriesSlug = book.series ? slugify(book.series.name) : '';
  const filteredSimilar = similarBooks?.filter((sb) => sb._id !== book._id).slice(0, 4) ?? [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">

      {/* ── Back to library ─────────────────────────────────────────── */}
      <button
        type="button"
        onClick={goBack}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 transition-colors hover:text-primary"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to library
      </button>

      {/* ── Series navigation strip ─────────────────────────────────── */}
      {hasSeriesSection && (
        <SeriesStrip seriesName={book.series!.name} books={seriesBooks!} currentId={book._id} />
      )}

      {/* ── Main product layout ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-start">

        {/* Cover + thumbnails */}
        <div>
          <button
            type="button"
            onClick={() => setZoomOpen(true)}
            className="group relative block w-full overflow-hidden rounded-3xl shadow-md focus:outline-none focus:ring-4 focus:ring-primary/20"
          >
            <img
              src={mainImage}
              alt={book.title}
              className="w-full aspect-square object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
            <span className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm">
              <ZoomIn className="h-3.5 w-3.5" /> Click to zoom
            </span>
          </button>

          {gallery.length > 1 && (
            <div className="mt-4 flex gap-3">
              {gallery.map((url, i) => {
                const isActive = mainImage === url;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveImage(url)}
                    className={`h-16 w-16 overflow-hidden rounded-xl border-2 transition-colors ${
                      isActive ? 'border-primary' : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="min-w-0">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-navy leading-tight">
            {book.title}
          </h1>
          {book.author && (
            <p className="mt-2 text-gray-500">By <span className="font-medium text-gray-600">{book.author}</span></p>
          )}

          {/* Pills */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Pill className="bg-chip-rose text-primary-dark">{book.ageGroupMin}–{book.ageGroupMax} yrs</Pill>
            {categoryName && <Pill className="bg-chip-indigo text-secondary-dark">{categoryName}</Pill>}
            {book.kind === 'puzzle' && <Pill className="bg-purple-100 text-purple-700">Puzzle</Pill>}
            {!planAccess.includes('LITTLE_READER') && restrictedPlanLabels.length > 0 && (
              <Pill className="bg-amber-100 text-amber-800">{restrictedPlanLabels.join(' + ')}</Pill>
            )}
            <Pill className="bg-chip-butter text-amber-700">
              <Star className="h-3.5 w-3.5 fill-primary text-primary" /> Loved by parents
            </Pill>
          </div>

          {book.description && (
            <p className="mt-5 text-gray-600 leading-relaxed">{book.description}</p>
          )}

          {/* Spec cards */}
          <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-4">
            <SpecCard icon={<FileText className="h-5 w-5" />} top={book.numPages ?? '—'} bottom="pages" />
            <SpecCard icon={<Palette className="h-5 w-5" />} top="Cover" bottom={coverLabel} />
            <SpecCard icon={<Check className="h-5 w-5" />} top="Reading Level" bottom={book.readingLevel ?? '—'} />
          </div>

          {/* Availability */}
          <div className="mt-5">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              isAvailable ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
              {isAvailable
                ? `${availableCopies} ${availableCopies === 1 ? 'copy' : 'copies'} available`
                : 'Currently borrowed out'}
            </span>
          </div>

          {/* Quantity + actions */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center rounded-full border border-gray-300 bg-white">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                className="grid h-11 w-11 place-items-center rounded-full text-gray-600 disabled:opacity-40 hover:bg-gray-50"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center font-semibold text-gray-800">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                disabled={qty >= maxQty}
                className="grid h-11 w-11 place-items-center rounded-full text-gray-600 disabled:opacity-40 hover:bg-gray-50"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={handleAddToBox}
              className={`flex-1 min-w-[180px] inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-bold uppercase tracking-wide text-sm transition-colors ${
                inBasket
                  ? 'bg-primary/10 text-primary-dark border-2 border-primary'
                  : 'bg-primary hover:bg-primary-dark text-white shadow-sm'
              }`}
            >
              <ShoppingBasket className="h-4 w-4" />
              {inBasket ? 'In your box' : 'Add to my box'}
            </button>

            <button
              onClick={() => handleWishlist(book._id, book.title)}
              aria-pressed={isWishlisted}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              className={`grid h-12 w-12 place-items-center rounded-full border-2 transition-colors ${
                isWishlisted ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/40'
              }`}
            >
              <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-primary text-primary' : 'text-primary'}`} />
            </button>
          </div>

          {/* Value props */}
          <div className="mt-6 rounded-2xl bg-chip-mint/70 p-5 space-y-3">
            {['Easy monthly swap', 'Clean, quality-checked books', 'Building a love for reading'].map((line) => (
              <p key={line} className="flex items-center gap-3 text-sm font-medium text-gray-700">
                <Check className="h-4 w-4 text-accent" strokeWidth={3} />
                {line}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* ── Plan banner ─────────────────────────────────────────────── */}
      <section className="rounded-3xl bg-secondary px-6 sm:px-10 py-8 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="max-w-xl">
          <h2 className="font-display text-2xl sm:text-3xl font-bold">Borrow this as part of your monthly plan</h2>
          <p className="mt-2 text-white/80 text-sm leading-relaxed">
            Get unlimited access to our entire library. Swap books anytime, keep what you love.
            Cancel anytime. Perfect for curious minds and growing readers.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-shrink-0">
          <Link
            to="/membership"
            className="inline-flex items-center justify-center rounded-full bg-white px-6 py-2.5 font-semibold text-secondary hover:bg-white/90 transition-colors"
          >
            View Plans
          </Link>
          <Link
            to="/faq"
            className="inline-flex items-center justify-center rounded-full border border-white/60 px-6 py-2.5 font-semibold text-white hover:bg-white/10 transition-colors"
          >
            How it works
          </Link>
        </div>
      </section>

      {/* ── More in this series ─────────────────────────────────────── */}
      {hasSeriesSection && (
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-heading font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              More in "{book.series!.name}"
            </h2>
            <Link to={`/series/${seriesSlug}`} className="text-sm font-semibold text-primary hover:underline">
              View series page →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {seriesBooks!.map((sb) => {
              const isCurrent = sb._id === book._id;
              return (
                <Link
                  key={sb._id}
                  to={`/library/${sb._id}`}
                  className={`group relative rounded-2xl border bg-white p-3 shadow-sm transition-all ${
                    isCurrent
                      ? 'border-primary ring-2 ring-primary/20 pointer-events-none'
                      : 'border-gray-100 hover:shadow-md hover:border-gray-200'
                  }`}
                >
                  {sb.series?.index != null && (
                    <span className={`absolute top-2 left-2 z-10 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isCurrent ? 'bg-primary text-white' : 'bg-gray-800/70 text-white'
                    }`}>
                      #{sb.series.index}
                    </span>
                  )}
                  {isCurrent && (
                    <span className="absolute top-2 right-2 z-10 text-[9px] font-bold bg-primary text-white px-1.5 py-0.5 rounded-full">
                      You're here
                    </span>
                  )}
                  <img
                    src={sb.coverImage || `https://placehold.co/300x400?text=${encodeURIComponent(sb.title)}`}
                    alt={sb.title}
                    className={`aspect-[2/3] w-full rounded-lg object-cover mb-2 ${isCurrent ? 'opacity-70' : 'group-hover:scale-[1.02] transition-transform'}`}
                  />
                  <h3 className="font-semibold text-gray-900 text-xs line-clamp-2 leading-snug">{sb.title}</h3>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Similar books ───────────────────────────────────────────── */}
      {filteredSimilar.length > 0 && (
        <section className="text-center">
          <p className="text-sm font-bold uppercase tracking-wide text-primary">View Similar Books</p>
          <h2 className="mt-1 font-display text-3xl sm:text-4xl font-bold text-gray-900">
            More books your child will love
          </h2>
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-5 text-left">
            {filteredSimilar.map((sb) => (
              <SimilarCard
                key={sb._id}
                book={sb}
                wishlisted={wishlist.includes(sb._id)}
                onWishlist={() => handleWishlist(sb._id, sb.title)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Zoom lightbox ───────────────────────────────────────────── */}
      {zoomOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setZoomOpen(false)}
        >
          <button
            type="button"
            onClick={() => setZoomOpen(false)}
            className="absolute top-5 right-5 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={mainImage}
            alt={book.title}
            className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

// ── Similar-book card ────────────────────────────────────────────────────────

function SimilarCard({ book, wishlisted, onWishlist }: { book: IBook; wishlisted: boolean; onWishlist: () => void }) {
  const badge = book.kind === 'puzzle' ? 'Puzzle' : book.series ? 'Series' : 'Book';
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
          <Pill className="bg-chip-rose text-primary-dark">{book.ageGroupMin}–{book.ageGroupMax} yrs</Pill>
          {book.series && <Pill className="bg-chip-indigo text-secondary-dark">{book.series.name}</Pill>}
        </div>
      </div>
    </div>
  );
}

// ── Series strip (compact horizontal navigation) ─────────────────────────────

function SeriesStrip({ seriesName, books, currentId }: { seriesName: string; books: IBook[]; currentId: string }) {
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-2xl px-5 py-4">
      <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-3 flex items-center gap-1.5">
        <BookOpen className="h-3.5 w-3.5" />
        {seriesName} Series · {books.length} books
      </p>
      <div className="flex flex-wrap gap-2">
        {books.map((b) => {
          const isCurrent = b._id === currentId;
          return (
            <Link
              key={b._id}
              to={`/library/${b._id}`}
              aria-current={isCurrent ? 'page' : undefined}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                isCurrent
                  ? 'bg-primary text-white cursor-default pointer-events-none'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-primary hover:text-primary'
              }`}
            >
              <span className="opacity-60">#{b.series?.index}</span>
              <span className="max-w-[120px] truncate">{b.title}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ── Small helpers ────────────────────────────────────────────────────────────

// Mirror of the server-side slug rule so series links resolve consistently.
function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function Pill({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${className}`}>
      {children}
    </span>
  );
}

function SpecCard({ icon, top, bottom }: { icon: React.ReactNode; top: React.ReactNode; bottom: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center">
      <div className="mx-auto mb-2 grid h-9 w-9 place-items-center rounded-full bg-gray-50 text-gray-500">
        {icon}
      </div>
      <p className="font-bold text-gray-900 leading-tight text-sm">{top}</p>
      <p className="text-xs text-gray-500 mt-0.5">{bottom}</p>
    </div>
  );
}
