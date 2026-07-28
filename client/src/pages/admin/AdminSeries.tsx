import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { ISeries, IBook } from '@/types';
import { toast } from 'sonner';
import { ImagePlus, Pencil, Trash2, X, ExternalLink, Plus, Search, ArrowUp, ArrowDown } from 'lucide-react';
import { Link } from 'react-router-dom';

const inputCls =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20';

export default function AdminSeries() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<ISeries | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['series'],
    queryFn: async () => {
      const res = await api.get('/series');
      return res.data.series as ISeries[];
    },
  });

  // Release object URLs created for the local file preview.
  useEffect(() => {
    return () => {
      if (preview && file) URL.revokeObjectURL(preview);
    };
  }, [preview, file]);

  const resetForm = () => {
    setEditing(null);
    setName('');
    setDescription('');
    setFile(null);
    if (preview && file) URL.revokeObjectURL(preview);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const startEdit = (s: ISeries) => {
    setEditing(s);
    setName(s.name);
    setDescription(s.description ?? '');
    setFile(null);
    setPreview(s.coverImage ?? null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Pre-fill the form to add managed metadata for a series that only exists
  // implicitly (books carry the name, but there's no Series record yet).
  const startCreateFor = (s: ISeries) => {
    setEditing(null);
    setName(s.name);
    setDescription('');
    setFile(null);
    setPreview(s.coverImage ?? null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onPickFile = (f: File | null) => {
    if (preview && file) URL.revokeObjectURL(preview);
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    } else {
      setFile(null);
      setPreview(editing?.coverImage ?? null);
    }
  };

  const save = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append('name', name.trim());
      fd.append('description', description.trim());
      if (file) fd.append('image', file);
      const headers = { 'Content-Type': 'multipart/form-data' };
      if (editing?._id) {
        await api.put(`/series/${editing._id}`, fd, { headers });
      } else {
        await api.post('/series', fd, { headers });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['series'] });
      toast.success(editing?._id ? 'Series updated' : 'Series saved');
      resetForm();
    },
    onError: (err) =>
      toast.error(
        (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error saving series'
      ),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/series/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['series'] });
      toast.success('Series metadata deleted');
    },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Series</h1>
        <p className="text-sm text-gray-400">
          Give each book series a cover and description. Books join a series by their series name (set on the book form).
        </p>
      </div>

      {/* Create / edit form */}
      <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
          {editing?._id ? 'Edit series' : 'Add / manage series'}
        </h2>
        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Series name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputCls}
                placeholder="e.g. Benny the World Explorer"
              />
              <span className="mt-1 block text-xs text-gray-400">
                Must match the series name set on the books that belong to it.
              </span>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Description</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={inputCls}
                placeholder="Short blurb shown on the series page…"
              />
            </label>
          </div>

          {/* Cover uploader */}
          <div className="md:w-56">
            <span className="mb-1 block text-sm font-medium text-gray-700">Cover image</span>
            <label className="relative flex aspect-[4/3] cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50 hover:border-primary">
              {preview ? (
                <img src={preview} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex flex-col items-center gap-1.5 text-sm text-gray-500">
                  <ImagePlus className="h-6 w-6 text-gray-400" />
                  Upload cover
                </span>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={() => {
              if (!name.trim()) return toast.error('Series name is required');
              save.mutate();
            }}
            disabled={save.isPending}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {save.isPending ? 'Saving…' : editing?._id ? 'Save changes' : 'Save series'}
          </button>
          {(editing || name || preview) && (
            <button
              onClick={resetForm}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <X className="h-4 w-4" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Parts manager — only for a saved (managed) series */}
      {editing?._id && <SeriesParts seriesName={editing.name} />}

      {/* List */}
      {isLoading ? (
        <div className="text-gray-400">Loading…</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Cover</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Books</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data?.map((s) => (
                <tr key={s.slug}>
                  <td className="px-4 py-3">
                    {s.coverImage ? (
                      <img src={s.coverImage} alt="" className="h-12 w-16 rounded-md object-cover" />
                    ) : (
                      <div className="grid h-12 w-16 place-items-center rounded-md bg-gray-100 text-[10px] text-gray-400">
                        none
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{s.name}</div>
                    <Link to={`/series/${s.slug}`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      View page <ExternalLink className="h-3 w-3" />
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{s.bookCount}</td>
                  <td className="px-4 py-3">
                    {s.managed ? (
                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">Managed</span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">No metadata</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {s.managed && s._id ? (
                      <div className="inline-flex items-center gap-3">
                        <button onClick={() => startEdit(s)} className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-primary">
                          <Pencil className="h-4 w-4" /> Edit
                        </button>
                        <button
                          onClick={() => { if (confirm(`Delete metadata for "${s.name}"? Books are kept.`)) remove.mutate(s._id!); }}
                          className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => startCreateFor(s)} className="text-sm font-medium text-primary hover:underline">
                        Add cover & info
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {data?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">
                    No series yet. Add a series name to a book, then manage it here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Parts manager ────────────────────────────────────────────────────────────
// Lists the books that make up a series (ordered by part #), lets the admin add
// standalone books, reorder them, and remove them — all keyed by series name.
function SeriesParts({ seriesName }: { seriesName: string }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: parts, isLoading } = useQuery({
    queryKey: ['series-parts', seriesName],
    queryFn: async () => {
      const res = await api.get('/series/manage/parts', { params: { name: seriesName } });
      return res.data.books as IBook[];
    },
  });

  // Candidate books to add: standalone titles (not already in any series).
  const { data: candidates } = useQuery({
    queryKey: ['series-parts-search', search],
    enabled: search.trim().length > 0,
    queryFn: async () => {
      const res = await api.get('/books', {
        params: { search: search.trim(), excludeSeries: 'true', limit: 8 },
      });
      return res.data.books as IBook[];
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['series-parts', seriesName] });
    queryClient.invalidateQueries({ queryKey: ['series'] });
    queryClient.invalidateQueries({ queryKey: ['series-parts-search'] });
  };

  const add = useMutation({
    mutationFn: async (bookId: string) => {
      await api.post('/series/manage/parts', { name: seriesName, bookId });
    },
    onSuccess: () => {
      invalidate();
      toast.success('Book added to series');
    },
    onError: () => toast.error('Could not add book'),
  });

  const remove = useMutation({
    mutationFn: async (bookId: string) => {
      await api.delete(`/series/manage/parts/${bookId}`);
    },
    onSuccess: () => {
      invalidate();
      toast.success('Book removed from series');
    },
  });

  const reorder = useMutation({
    mutationFn: async (bookIds: string[]) => {
      await api.put('/series/manage/parts/order', { name: seriesName, bookIds });
    },
    onSuccess: () => invalidate(),
    onError: () => toast.error('Could not reorder'),
  });

  const move = (idx: number, dir: number) => {
    if (!parts) return;
    const target = idx + dir;
    if (target < 0 || target >= parts.length) return;
    const ids = parts.map((b) => b._id);
    [ids[idx], ids[target]] = [ids[target], ids[idx]];
    reorder.mutate(ids);
  };

  return (
    <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500">
        Books in this series
      </h2>
      <p className="mb-4 text-xs text-gray-400">
        Add titles to "{seriesName}" and order them by part number.
      </p>

      {/* Current parts */}
      {isLoading ? (
        <div className="text-sm text-gray-400">Loading…</div>
      ) : parts && parts.length > 0 ? (
        <ul className="mb-5 divide-y divide-gray-100 rounded-xl border border-gray-100">
          {parts.map((b, i) => (
            <li key={b._id} className="flex items-center gap-3 px-3 py-2.5">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {b.series?.index ?? i + 1}
              </span>
              {b.coverImage ? (
                <img src={b.coverImage} alt="" className="h-10 w-8 rounded object-cover" />
              ) : (
                <div className="h-10 w-8 rounded bg-gray-100" />
              )}
              <span className="flex-1 truncate text-sm text-gray-800">{b.title}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => move(i, -1)}
                  disabled={i === 0 || reorder.isPending}
                  className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
                  title="Move up"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={i === parts.length - 1 || reorder.isPending}
                  className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
                  title="Move down"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  onClick={() => remove.mutate(b._id)}
                  className="rounded p-1 text-red-500 hover:bg-red-50"
                  title="Remove from series"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mb-5 rounded-xl border border-dashed border-gray-200 px-3 py-6 text-center text-sm text-gray-400">
          No books in this series yet.
        </div>
      )}

      {/* Add a book */}
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputCls} pl-9`}
          placeholder="Search standalone books to add…"
        />
      </label>

      {search.trim() && (
        <ul className="mt-2 max-h-72 divide-y divide-gray-100 overflow-y-auto rounded-xl border border-gray-100">
          {candidates && candidates.length > 0 ? (
            candidates.map((b) => (
              <li key={b._id} className="flex items-center gap-3 px-3 py-2">
                {b.coverImage ? (
                  <img src={b.coverImage} alt="" className="h-9 w-7 rounded object-cover" />
                ) : (
                  <div className="h-9 w-7 rounded bg-gray-100" />
                )}
                <span className="flex-1 truncate text-sm text-gray-800">{b.title}</span>
                <button
                  onClick={() => add.mutate(b._id)}
                  disabled={add.isPending}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              </li>
            ))
          ) : (
            <li className="px-3 py-6 text-center text-sm text-gray-400">
              No standalone books match. Books already in a series won't appear here.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
