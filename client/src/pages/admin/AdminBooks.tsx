import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { IBook } from '@/types';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Trash2, Edit, X, Images, Layers } from 'lucide-react';
import { getPlanLabel, normalizePlanAccess } from '@/lib/plans';

const categoryName = (book: IBook) =>
  typeof book.categoryId === 'object' && book.categoryId ? book.categoryId.name : '';

const placeholder = (book: IBook) =>
  book.coverImage || `https://placehold.co/240x320?text=${encodeURIComponent(book.title)}`;

const planNames = (book: IBook) =>
  normalizePlanAccess(book.planAccess, book.kind ?? 'book').map((plan) => getPlanLabel(plan)).join(', ');

export default function AdminBooks() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<IBook | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-books'],
    queryFn: async () => {
      // Pull the whole catalogue (the public list endpoint paginates by default).
      const res = await api.get('/books', { params: { limit: 10000 } });
      return res.data.books as IBook[];
    },
  });

  const deleteBook = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/books/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-books'] });
      setSelected(null);
      toast.success('Book deleted');
    },
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter((b) =>
      [b.title, b.shelfCode, categoryName(b), b.author, b.series?.name, b.box]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [data, search]);

  if (isLoading) return <div>Loading...</div>;

  return (
    /* The inner scroll pane is a desktop convenience; on mobile the grid flows
       with the page so there is only ever one scrollbar. */
    <div className="flex flex-col md:h-[calc(100vh-9rem)]">
      <div className="mb-5 flex flex-shrink-0 flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">
          Books{' '}
          <span className="text-base font-normal text-gray-400">
            ({filtered.length}{data && filtered.length !== data.length ? ` of ${data.length}` : ''})
          </span>
        </h1>
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, code, category, author…"
            className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm sm:w-72 sm:flex-none"
          />
          <Link to="/admin/books/new" className="whitespace-nowrap rounded-lg bg-primary px-4 py-2 font-medium text-white">
            Add New Book
          </Link>
        </div>
      </div>

      <div className="min-h-0 flex-1 pb-2 md:overflow-auto md:pr-1">
        {filtered.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-gray-400">No books match your search.</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filtered.map((book) => (
              <BookCard key={book._id} book={book} onOpen={() => setSelected(book)} onDelete={() => deleteBook.mutate(book._id)} />
            ))}
          </div>
        )}
      </div>

      {selected && (
        <BookDetailModal book={selected} onClose={() => setSelected(null)} onDelete={() => deleteBook.mutate(selected._id)} />
      )}
    </div>
  );
}

function BookCard({ book, onOpen, onDelete }: { book: IBook; onOpen: () => void; onDelete: () => void }) {
  const avail = book.availableCopies ?? book.totalCopies - (book.activeBorrowCount ?? 0);
  const out = avail <= 0;
  return (
    <div
      onClick={onOpen}
      className="group relative cursor-pointer overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md hover:border-gray-200"
    >
      <div className="relative aspect-[3/4] w-full bg-gray-100">
        <img src={placeholder(book)} alt={book.title} className="h-full w-full object-cover" loading="lazy" />

        {/* badges */}
        <div className="absolute left-1.5 top-1.5 flex flex-col gap-1">
          {book.kind === 'puzzle' && (
            <span className="rounded-full bg-purple-600/90 px-1.5 py-0.5 text-[10px] font-semibold text-white">Puzzle</span>
          )}
          {(book.images?.length ?? 0) > 1 && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white">
              <Images className="h-3 w-3" /> {book.images!.length}
            </span>
          )}
        </div>
        <span
          className={`absolute right-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
            out ? 'bg-red-600/90 text-white' : 'bg-green-600/90 text-white'
          }`}
        >
          {out ? 'Out' : `${avail} left`}
        </span>

        {/* hover actions */}
        <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1.5 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
          <Link
            to={`/admin/books/${book._id}/edit`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-blue-600 hover:bg-white"
            aria-label="Edit book"
          >
            <Edit className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Delete "${book.title}"?`)) onDelete();
            }}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-red-600 hover:bg-white"
            aria-label="Delete book"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="p-2">
        <p className="truncate text-sm font-semibold text-gray-900" title={book.title}>{book.title}</p>
        <p className="truncate text-[11px] text-gray-400">
          {book.shelfCode ? <span className="font-mono">{book.shelfCode}</span> : null}
          {book.shelfCode && categoryName(book) ? ' · ' : ''}
          {categoryName(book)}
        </p>
        <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500">
          <span>{book.ageGroupMin}-{book.ageGroupMax} yrs</span>
          <span className="inline-flex items-center gap-1">
            <Layers className="h-3 w-3" /> {book.totalCopies}
          </span>
        </div>
      </div>
    </div>
  );
}

function BookDetailModal({ book, onClose, onDelete }: { book: IBook; onClose: () => void; onDelete: () => void }) {
  const avail = book.availableCopies ?? book.totalCopies - (book.activeBorrowCount ?? 0);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{book.title}</h2>
            {book.series && <p className="text-sm text-primary">{book.series.name} · Book {book.series.index}</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-5 p-5 sm:flex-row">
          <div className="w-full flex-shrink-0 sm:w-40">
            <img src={placeholder(book)} alt={book.title} className="w-full rounded-lg object-cover aspect-[3/4] bg-gray-100" />
            {book.images && book.images.length > 1 && (
              <div className="mt-2 grid grid-cols-4 gap-1.5">
                {book.images.map((img, i) => (
                  <img key={img.publicId || i} src={img.url} alt="" className="aspect-square w-full rounded object-cover border border-gray-100" />
                ))}
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                {categoryName(book) || 'Uncategorized'}
              </span>
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                {book.ageGroupMin}-{book.ageGroupMax} yrs
              </span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${avail <= 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {avail <= 0 ? 'Out of stock' : `${avail} / ${book.totalCopies} available`}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <Detail label="Shelf code" value={book.shelfCode} />
              <Detail label="Box" value={book.box} />
              <Detail label="Author" value={book.author} />
              <Detail label="Pages" value={book.numPages} />
              <Detail label="Cover type" value={book.coverType} />
              <Detail label="Reading age" value={book.readingAge} />
              <Detail label="Reading level" value={book.readingLevel} />
              {book.kind === 'puzzle' && <Detail label="Pieces" value={book.pieceCount} />}
              {book.kind === 'puzzle' && <Detail label="Material" value={book.material} />}
              <Detail label="Plans" value={planNames(book)} />
            </div>

            {book.description && (
              <p className="mt-3 text-sm text-gray-600"><span className="font-medium text-gray-700">Description: </span>{book.description}</p>
            )}
            {book.keywords && book.keywords.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {book.keywords.map((k, i) => (
                  <span key={i} className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-600">{k}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 p-4">
          <button
            onClick={() => {
              if (confirm(`Delete "${book.title}"?`)) onDelete();
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
          <Link to={`/admin/books/${book._id}/edit`} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white">
            <Edit className="h-4 w-4" /> Edit book
          </Link>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div>
      <span className="text-gray-400">{label}: </span>
      <span className="text-gray-700 font-medium">{value}</span>
    </div>
  );
}
