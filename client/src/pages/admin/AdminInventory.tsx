import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { IBook } from '@/types';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { Search, Boxes, PackageCheck, AlertTriangle, PackageX, Minus, Plus } from 'lucide-react';

const LOW_STOCK_THRESHOLD = 2;

const categoryName = (book: IBook) =>
  typeof book.categoryId === 'object' && book.categoryId ? book.categoryId.name : '';

const available = (book: IBook) =>
  book.availableCopies ?? book.totalCopies - (book.activeBorrowCount ?? 0);

type Filter = 'all' | 'low' | 'out' | 'borrowed';
type Sort = 'available-asc' | 'available-desc' | 'borrowed-desc' | 'title-asc';

export default function AdminInventory() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('available-asc');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const { data: books = [], isLoading } = useQuery({
    queryKey: ['admin-books'],
    queryFn: async () => {
      const res = await api.get('/books', { params: { limit: 10000 } });
      return res.data.books as IBook[];
    },
  });

  const saveCopies = useMutation({
    mutationFn: async ({ id, totalCopies }: { id: string; totalCopies: number }) => {
      await api.put(`/books/${id}`, { totalCopies });
    },
    onMutate: ({ id }) => setSavingId(id),
    onSuccess: (_data, { id }) => {
      setDrafts((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ['admin-books'] });
      toast.success('Copies updated');
    },
    onError: (err) =>
      toast.error(
        (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Could not update copies'
      ),
    onSettled: () => setSavingId(null),
  });

  const stats = useMemo(() => {
    let totalCopies = 0;
    let borrowed = 0;
    let low = 0;
    let out = 0;
    for (const book of books) {
      totalCopies += book.totalCopies || 0;
      borrowed += book.activeBorrowCount ?? 0;
      const avail = available(book);
      if (avail <= 0) out += 1;
      else if (avail <= LOW_STOCK_THRESHOLD) low += 1;
    }
    return { titles: books.length, totalCopies, borrowed, availableNow: totalCopies - borrowed, low, out };
  }, [books]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = books.filter((book) => {
      if (term) {
        const haystack = [book.title, book.shelfCode, categoryName(book), book.author]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      const avail = available(book);
      switch (filter) {
        case 'low':
          return avail > 0 && avail <= LOW_STOCK_THRESHOLD;
        case 'out':
          return avail <= 0;
        case 'borrowed':
          return (book.activeBorrowCount ?? 0) > 0;
        default:
          return true;
      }
    });
    const sorters: Record<Sort, (a: IBook, b: IBook) => number> = {
      'available-asc': (a, b) => available(a) - available(b),
      'available-desc': (a, b) => available(b) - available(a),
      'borrowed-desc': (a, b) => (b.activeBorrowCount ?? 0) - (a.activeBorrowCount ?? 0),
      'title-asc': (a, b) => a.title.localeCompare(b.title),
    };
    return [...list].sort(sorters[sort]);
  }, [books, search, filter, sort]);

  if (isLoading) return <div>Loading...</div>;

  const filters: { value: Filter; label: string }[] = [
    { value: 'all', label: `All (${books.length})` },
    { value: 'low', label: `Low stock (${stats.low})` },
    { value: 'out', label: `Out of stock (${stats.out})` },
    { value: 'borrowed', label: 'Has borrows' },
  ];

  return (
    /* The pinned-height pane with its own scroll is a desktop affordance; on
       mobile the table scrolls with the page instead. */
    <div className="flex flex-col gap-4 md:h-[calc(100vh-9rem)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Tracking</h1>
          <p className="text-sm text-gray-500">Track copies of every title. Adjust counts inline — changes save instantly.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat icon={Boxes} label="Titles" value={stats.titles} />
        <Stat icon={PackageCheck} label="Available now" value={stats.availableNow} tone="success" />
        <Stat icon={Boxes} label="Borrowed" value={stats.borrowed} />
        <Stat icon={AlertTriangle} label={`Low (≤${LOW_STOCK_THRESHOLD})`} value={stats.low} tone="warning" />
        <Stat icon={PackageX} label="Out of stock" value={stats.out} tone="danger" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, code, category, author…"
            className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
        >
          <option value="available-asc">Available: low to high</option>
          <option value="available-desc">Available: high to low</option>
          <option value="borrowed-desc">Most borrowed</option>
          <option value="title-asc">Title A–Z</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              filter === item.value
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-gray-200 text-gray-500 hover:text-gray-800'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm md:overflow-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="sticky top-0 z-10 bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Book</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Category</th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Borrowed</th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Available</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Total copies</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-500">No titles match this view.</td>
              </tr>
            ) : rows.map((book) => {
              const avail = available(book);
              const out = avail <= 0;
              const low = avail > 0 && avail <= LOW_STOCK_THRESHOLD;
              const draft = drafts[book._id];
              const draftValue = draft ?? String(book.totalCopies);
              const dirty = draft !== undefined && Number(draft) !== book.totalCopies;
              const busy = savingId === book._id;
              const commit = (value: number) =>
                saveCopies.mutate({ id: book._id, totalCopies: Math.max(0, Math.round(value || 0)) });

              return (
                <tr key={book._id} className={out ? 'bg-red-50/60' : low ? 'bg-amber-50/50' : 'hover:bg-gray-50'}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={book.coverImage || 'https://placehold.co/40x56?text=Img'}
                        className="h-12 w-9 flex-shrink-0 rounded object-cover bg-gray-100"
                        alt=""
                      />
                      <div className="min-w-0">
                        <Link to={`/admin/books/${book._id}/edit`} className="font-medium text-gray-900 hover:text-primary">
                          {book.title}
                        </Link>
                        <div className="text-xs font-mono text-gray-400">{book.shelfCode || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{categoryName(book)}</td>
                  <td className="px-4 py-3 text-center text-gray-500">{book.activeBorrowCount ?? 0}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex min-w-[2.5rem] justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                        out ? 'bg-red-100 text-red-700' : low ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {out ? 'Out' : avail}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        aria-label="Decrease copies"
                        disabled={busy || book.totalCopies <= 0}
                        onClick={() => commit(book.totalCopies - 1)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded border border-gray-200 text-gray-500 hover:text-gray-800 disabled:opacity-40"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <input
                        type="number"
                        min={0}
                        value={draftValue}
                        onChange={(e) => setDrafts((c) => ({ ...c, [book._id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commit(Number(draftValue));
                        }}
                        className="w-16 rounded border border-gray-200 px-2 py-1.5 text-center"
                      />
                      <button
                        type="button"
                        aria-label="Increase copies"
                        disabled={busy}
                        onClick={() => commit(book.totalCopies + 1)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded border border-gray-200 text-gray-500 hover:text-gray-800 disabled:opacity-40"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                      {dirty && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => commit(Number(draftValue))}
                          className="rounded bg-primary px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                        >
                          {busy ? '…' : 'Save'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone = 'default',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone?: 'default' | 'success' | 'warning' | 'danger';
}) {
  const tones: Record<string, string> = {
    default: 'text-gray-900',
    success: 'text-green-600',
    warning: 'text-amber-600',
    danger: 'text-red-600',
  };
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <span className={`inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-50 ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">{label}</p>
        <p className={`text-2xl font-bold leading-tight ${tones[tone]}`}>{value}</p>
      </div>
    </div>
  );
}
