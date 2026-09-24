import { useEffect, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import api from '@/lib/axios';
import { IBook, ICategory, ISeries } from '@/types';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Heart, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { useWishlistStore } from '@/store/wishlistStore';
import { toast } from 'sonner';
import CtaSection from '@/components/home/CtaSection';

const AGE_BANDS = [
  { label: '0–2 yrs', min: 0, max: 2 },
  { label: '2–4 yrs', min: 2, max: 4 },
  { label: '4–6 yrs', min: 4, max: 6 },
  { label: '6–8 yrs', min: 6, max: 8 },
];

type Tab = '' | 'book' | 'puzzle' | 'series';

const TABS: { value: Tab; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'book', label: 'Books' },
  { value: 'puzzle', label: 'Puzzles' },
  { value: 'series', label: 'Series' },
];

const TAB_VALUES = TABS.map((t) => t.value);

const SORTS: { value: string; label: string }[] = [
  { value: '', label: 'Default' },
  { value: 'title-asc', label: 'Title A–Z' },
  { value: 'title-desc', label: 'Title Z–A' },
  { value: 'oldest', label: 'Oldest first' },
];

const PAGE_SIZE = 30;

// Classification badge shown on each cover.
function kindBadge(book: IBook): string {
  if (book.kind === 'puzzle') return 'PUZZLE';
  if (book.series) return 'SERIES';
  const cat = typeof book.categoryId === 'object' && book.categoryId ? book.categoryId.name : '';
  if (/stor/i.test(cat)) return 'STORIES';
  return 'BOOK';
}

function categoryLabel(book: IBook): string {
  return typeof book.categoryId === 'object' && book.categoryId ? book.categoryId.name : '';
}

interface BooksResponse {
  books: IBook[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export default function Library() {
  // Filters are mirrored into the URL query string so that navigating away to a
  // book and pressing Back restores the exact view (and so filtered views are
  // shareable). State is seeded from the URL on first mount.
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(() => searchParams.get('q') ?? '');
  const [debounced, setDebounced] = useState(() => searchParams.get('q') ?? '');
  const [tab, setTab] = useState<Tab>(() => {
    const t = searchParams.get('tab') as Tab | null;
    return t && TAB_VALUES.includes(t) ? t : '';
  });
  const [ageIdx, setAgeIdx] = useState<number | null>(() => {
    const a = Number(searchParams.get('age'));
    return searchParams.get('age') !== null && AGE_BANDS[a] ? a : null;
  });
  const [category, setCategory] = useState(() => searchParams.get('category') ?? '');
  const [sort, setSort] = useState(() => {
    const s = searchParams.get('sort') ?? '';
    return SORTS.some((opt) => opt.value === s) ? s : '';
  });
  const [page, setPage] = useState(() => Math.max(1, Number(searchParams.get('page')) || 1));

  const wishlist = useWishlistStore((s) => s.wishlist);
  const toggleWishlist = useWishlistStore((s) => s.toggle);

  // Debounce the search box so we don't fire a request on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // The "Series" tab is a distinct view (a collection of series), not a book
  // filter, so we never pass it to the books API.
  const seriesView = tab === 'series';
  const kind = seriesView ? '' : tab;

  // Any filter change resets pagination back to page 1.
  useEffect(() => {
    setPage(1);
  }, [debounced, tab, ageIdx, category, sort]);

  // Keep the URL in sync with the active filters. `replace` so each keystroke /
  // toggle doesn't pile up history entries — Back still returns to the page the
  // user came from with these filters intact.
  useEffect(() => {
    const next: Record<string, string> = {};
    if (debounced) next.q = debounced;
    if (tab) next.tab = tab;
    if (ageIdx !== null) next.age = String(ageIdx);
    if (category) next.category = category;
    if (sort) next.sort = sort;
    if (page > 1) next.page = String(page);
    setSearchParams(next, { replace: true });
  }, [debounced, tab, ageIdx, category, sort, page, setSearchParams]);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data.categories as ICategory[];
    },
  });

  const band = ageIdx !== null ? AGE_BANDS[ageIdx] : null;

  // Series collection — loaded once and shown when the Series tab is active.
  const { data: seriesList, isLoading: seriesLoading } = useQuery({
    queryKey: ['series'],
    queryFn: async () => {
      const res = await api.get('/series');
      return (res.data.series as ISeries[]).filter((s) => s.bookCount > 0);
    },
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['books', debounced, kind, category, ageIdx, sort, page],
    queryFn: async () => {
      const res = await api.get('/books', {
        params: {
          search: debounced || undefined,
          kind: kind || undefined,
          category: category || undefined,
          ageMin: band?.min,
          ageMax: band?.max,
          sort: sort || undefined,
          page,
          limit: PAGE_SIZE,
        },
      });
      return res.data as BooksResponse;
    },
    enabled: !seriesView,
    placeholderData: keepPreviousData,
  });

  const total = data?.pagination.total ?? 0;
  const totalPages = data?.pagination.pages ?? 1;
  const books = data?.books ?? [];

  // Filter + sort the series collection client-side (the list is small).
  const visibleSeries = (seriesList ?? [])
    .filter((s) => !debounced || s.name.toLowerCase().includes(debounced.toLowerCase()))
    .sort((a, b) => (sort === 'title-desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name)));

  const handleWishlist = (book: IBook) => {
    const wasOn = wishlist.includes(book._id);
    if (!toggleWishlist(book._id)) return;
    toast.success(wasOn ? `Removed "${book.title}" from wishlist` : `Saved "${book.title}" to your wishlist`);
  };

  return (
    <div className="bg-white sm:bg-background">
      <div className="mx-auto max-w-[1600px] px-[14px] pb-12 pt-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        {/* Heading */}
        <div className="text-center">
          <p className="font-body text-[14px] font-medium uppercase tracking-[2px] text-[#fe753b] sm:text-[15px] sm:font-semibold sm:text-primary">Library</p>
          <h1 className="mt-1 font-heading text-[26px] font-extrabold leading-[1.2] text-[#1a1a1a] sm:mt-2 sm:text-[48px] sm:font-black sm:leading-[1.05] sm:tracking-[-1px] sm:text-ink">
            Explore the Library
          </h1>
        </div>

        {/* Search + kind toggle */}
        <div className="mt-6 flex flex-col items-stretch gap-3 px-[13px] sm:mt-8 sm:flex-row sm:items-center sm:gap-4 sm:px-0">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 sm:left-5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, author, keyword…"
              className="h-[45px] w-full rounded-full border border-[#e5e7eb] bg-white pl-[53px] pr-5 text-[14px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:h-auto sm:border-black/10 sm:py-3.5 sm:pl-14 sm:text-[15px] sm:shadow-sm"
            />
          </div>
          {/* Phone: loose pills, as designed. From sm up: one segmented control. */}
          <div className="flex max-w-full items-center gap-[9px] self-center sm:gap-1 sm:rounded-full sm:border sm:border-black/10 sm:bg-white sm:p-1 sm:shadow-sm">
            {TABS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTab(t.value)}
                className={`h-[30px] shrink-0 whitespace-nowrap rounded-full px-[18px] font-body text-[12px] font-semibold transition sm:h-auto sm:px-5 sm:py-2 sm:text-sm sm:font-bold ${
                  tab === t.value
                    ? 'bg-[#fcede4] text-[#ef692b] sm:bg-primary sm:text-white sm:shadow-sm'
                    : 'border border-[#f1f5f9] bg-white text-[#62748e] sm:border-0 sm:bg-transparent sm:text-ink sm:hover:text-primary'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Age + Category filters — only apply to the book listings */}
        {!seriesView && (
          <>
            <FilterRow label="Age">
              <Pill active={ageIdx === null} variant="solid" onClick={() => setAgeIdx(null)}>
                All Ages
              </Pill>
              {AGE_BANDS.map((b, i) => (
                <Pill key={b.label} active={ageIdx === i} variant="solid" onClick={() => setAgeIdx(i)}>
                  {b.label}
                </Pill>
              ))}
            </FilterRow>

            <FilterRow label="Category">
              <Pill active={category === ''} variant="soft" onClick={() => setCategory('')}>
                All Categories
              </Pill>
              {categories?.map((c) => (
                <Pill key={c._id} active={category === c._id} variant="soft" onClick={() => setCategory(c._id)}>
                  {c.iconEmoji ? `${c.iconEmoji} ` : ''}
                  {c.name}
                </Pill>
              ))}
            </FilterRow>
          </>
        )}

        {/* Results header */}
        <div className="mt-6 flex items-center justify-between gap-4 sm:mt-10">
          <p className="text-[11px] font-medium uppercase text-slate-label sm:text-sm sm:normal-case sm:text-text-muted">
            {seriesView ? (
              seriesLoading ? 'Loading…' : (
                <>
                  <span className="font-bold text-ink">{visibleSeries.length}</span>{' '}
                  {visibleSeries.length === 1 ? 'series' : 'series'}
                </>
              )
            ) : isLoading ? 'Loading…' : (
              <>
                <span className="font-bold text-ink">{total}</span> {total === 1 ? 'item' : 'items'}
                {band ? ` for ${band.label}` : ''}
              </>
            )}
          </p>
          <label className="relative">
            <span className="sr-only">Sort</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="cursor-pointer appearance-none rounded-full border border-black/10 bg-white py-1.5 pl-3 pr-8 text-[12px] font-semibold text-ink shadow-sm outline-none focus:border-primary sm:py-2.5 sm:pl-4 sm:pr-9 sm:text-sm"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  Sort: {s.label}
                </option>
              ))}
            </select>
            <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-gray-400" />
          </label>
        </div>

        {/* Series collection view */}
        {seriesView ? (
          <div className="mt-6">
            {seriesLoading ? (
              <div className="grid grid-cols-2 gap-[9px] sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-black/5 bg-white">
                    <div className="aspect-[3/2] w-full sm:aspect-square bg-gray-200" />
                    <div className="space-y-2 p-4">
                      <div className="h-4 w-2/3 rounded bg-gray-200" />
                      <div className="h-3 w-1/2 rounded bg-gray-200" />
                    </div>
                  </div>
                ))}
              </div>
            ) : visibleSeries.length === 0 ? (
              <div className="rounded-2xl border border-black/5 bg-white py-20 text-center">
                <p className="text-lg text-text-muted">
                  {debounced ? 'No series match your search.' : 'No series yet.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-[9px] sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                {visibleSeries.map((s) => (
                  <SeriesCard key={s.slug} series={s} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Book grid */}
            <div className={`mt-3 transition-opacity sm:mt-6 ${isFetching && !isLoading ? 'opacity-60' : 'opacity-100'}`}>
              {isLoading ? (
                <div className="grid grid-cols-2 gap-[9px] sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-black/5 bg-white">
                      <div className="aspect-[3/2] w-full bg-gray-200 sm:aspect-square" />
                      <div className="space-y-2 p-4">
                        <div className="h-4 w-2/3 rounded bg-gray-200" />
                        <div className="h-3 w-1/2 rounded bg-gray-200" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : books.length === 0 ? (
                <div className="rounded-2xl border border-black/5 bg-white py-20 text-center">
                  <p className="text-lg text-text-muted">No items match your filters.</p>
                  <button
                    onClick={() => {
                      setSearch('');
                      setTab('');
                      setAgeIdx(null);
                      setCategory('');
                      setSort('');
                    }}
                    className="mt-4 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-dark"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-[9px] sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                  {books.map((book) => (
                    <BookCard
                      key={book._id}
                      book={book}
                      inWishlist={wishlist.includes(book._id)}
                      onToggle={() => handleWishlist(book)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            )}
          </>
        )}
      </div>

      {/* The phone design goes straight from the pager to the footer. */}
      <div className="hidden sm:block">
        <CtaSection />
      </div>
    </div>
  );
}

// ── Book card ────────────────────────────────────────────────────────────────

function BookCard({ book, inWishlist, onToggle }: { book: IBook; inWishlist: boolean; onToggle: () => void }) {
  const badge = kindBadge(book);
  const cat = categoryLabel(book);
  const available = (book.availableCopies ?? 0) > 0;

  return (
    <div
      className={`group flex flex-col overflow-hidden rounded-[12px] border bg-white shadow-[0px_4px_6px_-4px_rgba(0,0,0,0.1)] transition-all hover:-translate-y-1 hover:shadow-lg sm:rounded-2xl sm:shadow-sm ${
        inWishlist ? 'border-primary' : 'border-black/5'
      }`}
    >
      <Link to={`/library/${book._id}`} className="relative block">
        <div className="relative aspect-[3/2] w-full sm:aspect-square overflow-hidden bg-gray-100">
          <img
            src={book.coverImage || `https://placehold.co/400x300?text=${encodeURIComponent(book.title)}`}
            alt={book.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <span className="absolute left-[10px] top-[10px] rounded-full bg-periwinkle px-[10px] py-[2px] text-[9px] font-semibold uppercase tracking-[0.8px] text-white sm:left-3 sm:top-3 sm:bg-secondary sm:px-3 sm:py-1 sm:text-[10px] sm:font-extrabold sm:tracking-wide sm:shadow">
            {badge}
          </span>
          {!available && (
            <span className="absolute bottom-0 left-0 w-full bg-danger/90 py-1 text-center text-[11px] font-bold text-white">
              Currently Borrowed
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col px-[10px] pb-[10px] pt-[8px] sm:p-4">
        <Link to={`/library/${book._id}`}>
          <h3 className="font-heading text-[14px] font-bold leading-[20px] text-[#0a0a0a] line-clamp-1 hover:text-primary sm:text-[17px] sm:font-extrabold sm:leading-snug sm:text-ink">
            {book.title}
          </h3>
        </Link>
        {book.author && <p className="mt-0.5 hidden truncate text-xs text-text-muted sm:block">{book.author}</p>}

        <div className="mt-auto flex items-center justify-between gap-2 pt-[6px] sm:pt-3">
          <div className="flex min-w-0 flex-wrap gap-1.5">
            <span className="whitespace-nowrap rounded-full bg-chip-peach px-2 py-0.5 text-[10px] font-semibold text-primary sm:bg-primary/10 sm:px-2.5 sm:text-[11px]">
              {book.ageGroupMin}–{book.ageGroupMax} yrs
            </span>
            {cat && (
              <span className="max-w-[80px] truncate rounded-full bg-chip-peach px-2 py-0.5 text-[10px] font-semibold text-primary sm:max-w-[110px] sm:bg-cream sm:px-2.5 sm:text-[11px] sm:text-text-muted">
                {cat}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onToggle}
            aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-pressed={inWishlist}
            className="-m-1 shrink-0 rounded-full p-1.5 transition hover:bg-danger/10 sm:m-0"
          >
            <Heart
              className={`h-[18px] w-[18px] transition sm:h-5 sm:w-5 ${inWishlist ? 'fill-danger text-danger' : 'text-danger sm:text-gray-300 sm:hover:text-danger'}`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Series card ──────────────────────────────────────────────────────────────

function SeriesCard({ series }: { series: ISeries }) {
  return (
    <Link
      to={`/series/${series.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-[3/2] w-full sm:aspect-square overflow-hidden bg-accent/10">
        {series.coverImage ? (
          <img
            src={series.coverImage}
            alt={series.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-accent text-sm font-semibold text-white">
            Series Cover Image
          </div>
        )}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white shadow">
          <Layers className="h-3 w-3" /> Series
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-heading text-[17px] font-extrabold leading-snug text-ink line-clamp-1 group-hover:text-primary">
          {series.name}
        </h3>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="whitespace-nowrap rounded-full bg-secondary/10 px-2.5 py-0.5 text-[11px] font-semibold text-secondary-dark">
            {series.bookCount} {series.bookCount === 1 ? 'book' : 'books'}
          </span>
          {series.ageGroupMax > 0 && (
            <span className="whitespace-nowrap rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              {series.ageGroupMin}–{series.ageGroupMax} yrs
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Filter row + pill ────────────────────────────────────────────────────────

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 flex items-center gap-3 sm:mt-5 sm:gap-2.5">
      <span className="shrink-0 text-[12px] font-medium uppercase text-black sm:mr-1 sm:text-[11px] sm:font-bold sm:tracking-[1.5px] sm:text-text-muted">
        {label}
      </span>
      {/* Phones: one row that scrolls sideways, faded at the edge to show there's more. */}
      <div className="-mr-[14px] flex min-w-0 flex-1 gap-[7px] overflow-x-auto pr-[14px] [-ms-overflow-style:none] [mask-image:linear-gradient(to_right,black_85%,transparent)] [scrollbar-width:none] sm:mr-0 sm:flex-wrap sm:gap-2.5 sm:overflow-visible sm:pr-0 sm:[mask-image:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
    </div>
  );
}

function Pill({
  active,
  variant,
  onClick,
  children,
}: {
  active: boolean;
  variant: 'solid' | 'soft';
  onClick: () => void;
  children: React.ReactNode;
}) {
  const activeCls =
    variant === 'solid'
      ? 'bg-primary text-white border-primary sm:shadow-sm'
      : 'border-[#eff0fe] bg-[#eff0fe] text-periwinkle sm:bg-primary/10 sm:text-primary sm:border-primary/20';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-[3px] text-[11px] font-semibold transition sm:px-4 sm:py-1.5 sm:text-sm ${
        active
          ? activeCls
          : 'border-[#e2e8f0] bg-white text-[#45556c] hover:border-primary hover:text-primary sm:border-black/10 sm:text-ink'
      }`}
    >
      {children}
    </button>
  );
}

// ── Pagination ───────────────────────────────────────────────────────────────

function pageItems(current: number, total: number): (number | '…')[] {
  const items: (number | '…')[] = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - current) <= 1) {
      items.push(i);
    } else if (items[items.length - 1] !== '…') {
      items.push('…');
    }
  }
  return items;
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  const items = pageItems(page, totalPages);
  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:mt-10">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        aria-label="Previous page"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full sm:h-10 sm:w-10 border border-black/10 bg-white text-ink transition hover:border-primary hover:text-primary disabled:opacity-40 disabled:hover:border-black/10 disabled:hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {items.map((it, i) =>
        it === '…' ? (
          <span key={`gap-${i}`} className="px-1 text-text-muted">
            …
          </span>
        ) : (
          <button
            key={it}
            type="button"
            onClick={() => onChange(it)}
            aria-current={it === page ? 'page' : undefined}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full sm:h-10 sm:w-10 text-sm font-bold transition ${
              it === page
                ? 'bg-primary text-white shadow-sm'
                : 'border border-black/10 bg-white text-ink hover:border-primary hover:text-primary'
            }`}
          >
            {it}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        aria-label="Next page"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full sm:h-10 sm:w-10 border border-black/10 bg-white text-ink transition hover:border-primary hover:text-primary disabled:opacity-40 disabled:hover:border-black/10 disabled:hover:text-ink"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
