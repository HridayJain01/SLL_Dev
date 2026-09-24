import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { IBook } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useBookBasketStore } from '@/store/bookBasketStore';
import { useWishlistStore } from '@/store/wishlistStore';
import {
  Check, BookOpen, ShoppingBasket, Plus, Minus, Heart, ZoomIn, X, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { getPlanLabel, normalizePlanAccess } from '@/lib/plans';
import { usePuzzleBlock } from '@/lib/usePuzzleBlock';
import CtaSection from '@/components/home/CtaSection';
import galleryArrow from '@/assets/figma/gallery-arrow.svg';
import specTile from '@/assets/figma/spec-tile.png';

export default function BookDetails() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const selectedBooks = useBookBasketStore((s) => s.selectedBooks);
  const addBook = useBookBasketStore((s) => s.addBook);
  const removeBook = useBookBasketStore((s) => s.removeBook);

  const wishlist = useWishlistStore((s) => s.wishlist);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const puzzleBlock = usePuzzleBlock();

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

  // The server's count already includes this member if they had it hearted when
  // the page loaded; adjust from that so the line moves as soon as they tap the heart.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const wishlistedAtLoad = useMemo(() => !!bookId && wishlist.includes(bookId), [data]);

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
  const wishlistCount = (book.wishlistCount ?? 0) - (wishlistedAtLoad ? 1 : 0) + (isWishlisted ? 1 : 0);
  const blockedReason = puzzleBlock(book);

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
    } else if (blockedReason) {
      toast.error(blockedReason);
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
    if (!toggleWishlist(id)) return;
    const nowOn = !wishlist.includes(id);
    toast.success(nowOn ? `Saved "${title}" to your wishlist` : `Removed "${title}" from wishlist`);
  };

  const hasSeriesSection = book.series && seriesBooks && seriesBooks.length > 1;
  const seriesSlug = book.series ? slugify(book.series.name) : '';
  const filteredSimilar = similarBooks?.filter((sb) => sb._id !== book._id).slice(0, 4) ?? [];

  const galleryIdx = Math.max(0, gallery.indexOf(mainImage));
  const stepImage = (delta: number) =>
    setActiveImage(gallery[(galleryIdx + delta + gallery.length) % gallery.length]);

  const wishlistButton = (className: string) => (
    <button
      onClick={() => handleWishlist(book._id, book.title)}
      aria-pressed={isWishlisted}
      aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      className={`grid place-items-center rounded-full border-2 transition-colors ${
        isWishlisted ? 'border-primary bg-primary/5' : 'border-[#e2e8f0] bg-white hover:border-primary/40'
      } ${className}`}
    >
      <Heart className={`h-5 w-5 text-primary ${isWishlisted ? 'fill-primary' : ''}`} />
    </button>
  );

  const addToBoxLabel = inBasket ? 'In your box' : 'Add to my Box';

  return (
    // The phone "Add to my Box" bar sticks to the bottom of this wrapper, so it
    // rides along through the page and settles above the footer.
    <div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 space-y-8 sm:space-y-10">

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-14 items-start">

          {/* Cover + thumbnails */}
          <div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setZoomOpen(true)}
                aria-label="Zoom image"
                className="group relative block w-full overflow-hidden rounded-[17px] bg-[#279a92] shadow-md focus:outline-none focus:ring-4 focus:ring-primary/20 sm:rounded-3xl"
              >
                <img
                  src={mainImage}
                  alt={book.title}
                  className="aspect-[359/222] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] sm:aspect-square"
                />
                <span className="absolute bottom-4 right-4 hidden items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm sm:inline-flex">
                  <ZoomIn className="h-3.5 w-3.5" /> Click to zoom
                </span>
              </button>
              {gallery.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => stepImage(-1)}
                    aria-label="Previous image"
                    className="absolute left-[11px] top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center"
                  >
                    <img src={galleryArrow} alt="" className="h-[23.347px] w-[23.347px] rotate-180" />
                  </button>
                  <button
                    type="button"
                    onClick={() => stepImage(1)}
                    aria-label="Next image"
                    className="absolute right-[8px] top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center"
                  >
                    <img src={galleryArrow} alt="" className="h-[23.347px] w-[23.347px]" />
                  </button>
                </>
              )}
            </div>

            {gallery.length > 1 && (
              <div className="mt-2 flex gap-3 overflow-x-auto [scrollbar-width:none] sm:mt-4 [&::-webkit-scrollbar]:hidden">
                {gallery.map((url, i) => {
                  const isActive = mainImage === url;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveImage(url)}
                      aria-label={`Show image ${i + 1}`}
                      className={`h-[66px] w-[108px] shrink-0 overflow-hidden rounded-[16px] border-2 transition-colors sm:h-16 sm:w-16 sm:rounded-xl ${
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
            <h1 className="font-heading text-[22px] font-extrabold leading-[1.3] tracking-[-0.85px] text-[#1d293d] sm:text-4xl md:text-5xl sm:leading-tight">
              {book.title}
            </h1>
            {book.author && (
              <p className="mt-1 font-body text-[14px] text-slate-label sm:mt-2 sm:text-base">By {book.author}</p>
            )}

            {book.description && (
              <p className="mt-2 font-body text-[12px] leading-[14px] tracking-[-0.31px] text-[#314158] sm:mt-4 sm:text-base sm:leading-relaxed sm:tracking-normal">
                {book.description}
              </p>
            )}

            {/* Pills + quantity */}
            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <Pill className="bg-[#fce7f3] text-[#e60076]">{book.ageGroupMin}–{book.ageGroupMax} yrs</Pill>
                {categoryName && <Pill className="bg-[#dbeafe] text-[#155dfc]">{categoryName}</Pill>}
                {book.kind === 'puzzle' && <Pill className="bg-purple-100 text-purple-700">Puzzle</Pill>}
                {!planAccess.includes('LITTLE_READER') && restrictedPlanLabels.length > 0 && (
                  <Pill className="bg-amber-100 text-amber-800">{restrictedPlanLabels.join(' + ')}</Pill>
                )}
              </div>
              <div className="inline-flex shrink-0 items-center rounded-full border border-[#e2e8f0] bg-white p-[2px]">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                  className="grid h-8 w-8 place-items-center rounded-full text-[#0f172b] disabled:opacity-40 hover:bg-gray-50 sm:h-10 sm:w-10"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-body text-[16px] font-semibold text-[#0f172b]">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                  disabled={qty >= maxQty}
                  className="grid h-8 w-8 place-items-center rounded-full text-[#0f172b] disabled:opacity-40 hover:bg-gray-50 sm:h-10 sm:w-10"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Spec tiles */}
            <div className="mt-4 grid grid-cols-3 gap-[22px] sm:gap-4">
              <SpecTile label="Cover" value={coverLabel} />
              <SpecTile label="Level" value={book.readingLevel ?? '—'} />
              <SpecTile label="Pages" value={book.numPages ?? '—'} />
            </div>

            {/* Availability */}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                isAvailable ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
                {isAvailable
                  ? `${availableCopies} ${availableCopies === 1 ? 'copy' : 'copies'} available`
                  : 'Currently borrowed out'}
              </span>
              {wishlistCount > 0 && (
                <p className="flex items-center gap-1.5 text-sm font-medium text-gray-600">
                  <Heart className="h-4 w-4 fill-primary text-primary" />
                  {wishlistCount} {wishlistCount === 1 ? 'member has' : 'members have'} wishlisted this
                </p>
              )}
            </div>

            {/* Actions — phones get the sticky bar at the bottom instead */}
            <div className="mt-5 hidden items-center gap-3 sm:flex">
              <button
                onClick={handleAddToBox}
                className={`flex-1 min-w-[180px] inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-bold uppercase tracking-wide text-sm transition-colors ${
                  inBasket
                    ? 'bg-primary/10 text-primary-dark border-2 border-primary'
                    : 'bg-primary hover:bg-primary-dark text-white shadow-sm'
                }`}
              >
                <ShoppingBasket className="h-4 w-4" />
                {addToBoxLabel}
              </button>
              {wishlistButton('h-12 w-12')}
            </div>

            {blockedReason && !inBasket && (
              <p className="mt-3 text-sm font-medium text-amber-800">{blockedReason}</p>
            )}

            {/* Value props */}
            <div className="mt-5 space-y-[2px] rounded-[16px] bg-[#f0fdfa] px-5 py-[10px] sm:mt-6 sm:space-y-3 sm:p-5">
              {['Easy monthly swap', 'Clean, quality-checked books', 'Building a love for reading'].map((line) => (
                <p key={line} className="flex items-center gap-3 font-body text-[12px] leading-[20px] text-[#314158] sm:text-sm sm:font-medium">
                  <Check className="h-5 w-5 shrink-0 text-[#00bba7]" strokeWidth={2} />
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* ── Plan banner ─────────────────────────────────────────────── */}
        <section className="flex items-center justify-between gap-4 rounded-[16px] bg-cerulean px-[11px] py-[23px] text-white sm:gap-6 sm:rounded-3xl sm:px-10 sm:py-8">
          <div className="min-w-0 max-w-xl">
            <h2 className="font-body text-[14px] font-bold leading-[17px] tracking-[0.4px] sm:text-3xl sm:leading-tight sm:tracking-normal">
              Borrow this as part of your monthly plan
            </h2>
            <p className="mt-2 max-w-[200px] font-body text-[10px] leading-[15px] text-white/90 sm:max-w-none sm:text-sm sm:leading-relaxed">
              Get unlimited access to our entire library. Swap books anytime, keep what you love.
              Cancel anytime<span className="hidden sm:inline">. Perfect for curious minds and growing readers.</span>
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-3">
            <Link
              to="/membership"
              className="inline-flex h-[32px] items-center justify-center rounded-full bg-primary px-5 font-body text-[12px] font-semibold text-white transition-colors hover:bg-primary-dark sm:h-auto sm:px-6 sm:py-2.5 sm:text-base"
            >
              View Plans
            </Link>
            <Link
              to="/#how-it-works"
              className="hidden items-center justify-center rounded-full border border-white/60 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-white/10 sm:inline-flex"
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
                    <img loading="lazy" decoding="async"
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
          <section>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-body text-[12px] font-medium uppercase tracking-[2px] text-[#fe753b] sm:text-sm">
                  View Similar Books
                </p>
                <h2 className="font-heading text-[16px] font-extrabold text-[#1d293d] sm:mt-1 sm:text-4xl">
                  More books your child will love
                </h2>
              </div>
              <Link
                to="/library"
                className="inline-flex shrink-0 items-center gap-1 font-body text-[12px] font-medium text-periwinkle hover:underline sm:text-sm"
              >
                See All <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-[7px] sm:mt-8 sm:gap-5 md:grid-cols-4">
              {filteredSimilar.map((sb, i) => (
                <div key={sb._id} className={i >= 2 ? 'hidden md:block' : ''}>
                  <SimilarCard book={sb} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <CtaSection />

      {/* ── Phone: sticky add-to-box bar ────────────────────────────── */}
      <div className="sticky bottom-0 z-40 rounded-t-[16px] bg-white px-[18px] pb-[max(16px,env(safe-area-inset-bottom))] pt-[20px] shadow-[-3px_-2px_4px_-1px_rgba(0,0,0,0.15)] sm:hidden">
        <div className="flex gap-[20px]">
          {wishlistButton('h-[47px] w-[102px] shrink-0')}
          <button
            onClick={handleAddToBox}
            className={`h-[47px] flex-1 rounded-full font-body text-[16px] font-bold tracking-[0.2px] transition-colors ${
              inBasket ? 'border-2 border-primary bg-primary/10 text-primary-dark' : 'bg-primary text-white'
            }`}
          >
            {addToBoxLabel}
          </button>
        </div>
      </div>

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

function SimilarCard({ book }: { book: IBook }) {
  const badge = book.kind === 'puzzle' ? 'Puzzle' : book.series ? 'Series' : 'Book';
  return (
    <Link
      to={`/library/${book._id}`}
      className="group block overflow-hidden rounded-[12px] border border-black/5 bg-white shadow-[0px_4px_6px_-4px_rgba(0,0,0,0.1)] transition-all hover:shadow-md sm:rounded-2xl"
    >
      <div className="relative aspect-[3/2] overflow-hidden bg-[#279a92] sm:aspect-[4/3]">
        <img loading="lazy" decoding="async"
          src={book.coverImage || `https://placehold.co/400x300?text=${encodeURIComponent(book.title)}`}
          alt={book.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute left-[10px] top-[10px] hidden rounded-full bg-periwinkle px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white sm:block">
          {badge}
        </span>
      </div>
      <div className="px-[10px] pb-[9px] pt-[6px] sm:p-4">
        <h3 className="font-heading text-[12px] font-bold leading-[20px] text-[#0a0a0a] line-clamp-1 sm:text-base">{book.title}</h3>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="whitespace-nowrap rounded-full bg-[#eceef2] px-2 py-0.5 font-body text-[10px] font-semibold text-black sm:text-xs">
            {book.ageGroupMin}–{book.ageGroupMax} yrs
          </span>
          <span className="inline-flex items-center gap-0.5 whitespace-nowrap font-body text-[10px] font-medium text-navy sm:text-xs">
            Borrow Now <ChevronRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
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

function SpecTile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      className="flex h-[45px] flex-col items-center justify-center rounded-[12px] bg-[#f54480] bg-cover bg-center text-center text-white sm:h-[64px]"
      style={{ backgroundImage: `url(${specTile})` }}
    >
      <p className="font-body text-[12px] leading-[16px]">{label}</p>
      <p className="font-body text-[14px] font-semibold leading-[20px] tracking-[-0.44px] sm:text-base">{value}</p>
    </div>
  );
}
