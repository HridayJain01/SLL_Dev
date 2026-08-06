import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useWatch, type FieldValues } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { ICategory, IBook } from '@/types';
import { ArrowLeft, GripVertical, ImagePlus, Plus, Star, X } from 'lucide-react';
import { PLAN_ORDER, PLAN_DEFINITIONS, normalizePlanAccess, type PlanCode } from '@/lib/plans';

type GalleryItem =
  | { id: string; kind: 'existing'; url: string; publicId: string }
  | { id: string; kind: 'new'; file: File; previewUrl: string };

let galleryUid = 0;
const nextGalleryId = () => `g${++galleryUid}`;

function previewSrc(item: GalleryItem) {
  return item.kind === 'existing' ? item.url : item.previewUrl;
}

const inputCls =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-gray-400">{hint}</span>}
    </label>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

const PLANS: PlanCode[] = [...PLAN_ORDER];

interface BookFormValues {
  title: string;
  description: string;
  ageGroupMin: number;
  ageGroupMax: number;
  categoryId: string;
  planAccess: string[];
  totalCopies: number;
  // Catalogue metadata
  seriesName?: string;
  seriesIndex?: number;
  author?: string;
  numPages?: number;
  coverType?: '' | 'Hardcover' | 'Softcover';
  readingLevel?: '' | 'Easy' | 'Medium' | 'Hard';
  readingAge?: string;
  kind?: 'book' | 'puzzle';
}

export default function AdminBookForm() {
  const { bookId } = useParams<{ bookId: string }>();
  const isEdit = !!bookId;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, control, setValue } = useForm<BookFormValues>({
    defaultValues: { planAccess: [], totalCopies: 1 },
  });
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const seeded = useRef<string | null>(null);

  const selectedPlans = useWatch({ control, name: 'planAccess' }) || [];
  const togglePlan = (plan: string) =>
    setValue(
      'planAccess',
      selectedPlans.includes(plan) ? selectedPlans.filter((p) => p !== plan) : [...selectedPlans, plan]
    );

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data.categories as ICategory[];
    },
  });

  // Own cache key: `['book', id]` is also used by the public book page, which
  // caches the whole `{ book, similarBooks, seriesBooks }` envelope under it.
  // Sharing the key handed this form the envelope instead of the book.
  // `refetchOnMount: 'always'` guarantees a re-read after a save, and skipping
  // the focus refetch keeps a background update from landing mid-edit.
  const { data: book } = useQuery({
    queryKey: ['admin-book', bookId],
    queryFn: async () => {
      const res = await api.get(`/books/${bookId}`);
      return res.data.book as IBook;
    },
    enabled: isEdit,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  });

  // Seed the form + gallery from the loaded book. Keyed on the document's
  // identity *and* its updatedAt so a stale cached copy shown on mount is
  // replaced by the fresh fetch, while later renders leave in-progress edits
  // alone.
  useEffect(() => {
    if (!book) return;
    const stamp = `${book._id}:${book.updatedAt ?? ''}`;
    if (seeded.current === stamp) return;
    seeded.current = stamp;
    reset({
      title: book.title,
      description: book.description,
      ageGroupMin: book.ageGroupMin,
      ageGroupMax: book.ageGroupMax,
      categoryId: typeof book.categoryId === 'object' ? book.categoryId._id : book.categoryId,
      planAccess: normalizePlanAccess(book.planAccess, book.kind ?? 'book'),
      totalCopies: book.totalCopies,
      seriesName: book.series?.name ?? '',
      seriesIndex: book.series?.index,
      author: book.author ?? '',
      numPages: book.numPages,
      coverType: book.coverType ?? '',
      readingLevel: book.readingLevel ?? '',
      readingAge: book.readingAge ?? '',
      kind: book.kind ?? 'book',
    });
    // Older records (imported before the gallery existed) carry only
    // coverImage/cloudinaryPublicId. Show that as the single existing image so
    // the cover is visible here — and so saving doesn't wipe it.
    const existing =
      book.images?.length
        ? book.images
        : book.coverImage && book.cloudinaryPublicId
          ? [{ url: book.coverImage, publicId: book.cloudinaryPublicId }]
          : [];

    setGallery((current) => {
      current.forEach((item) => {
        if (item.kind === 'new') URL.revokeObjectURL(item.previewUrl);
      });
      return existing.map((img) => ({
        id: nextGalleryId(),
        kind: 'existing' as const,
        url: img.url,
        publicId: img.publicId,
      }));
    });
  }, [book, reset]);

  // Release object URLs for new previews on unmount.
  useEffect(() => {
    return () => {
      gallery.forEach((item) => {
        if (item.kind === 'new') URL.revokeObjectURL(item.previewUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const next: GalleryItem[] = Array.from(files).map((file) => ({
      id: nextGalleryId(),
      kind: 'new' as const,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setGallery((current) => [...current, ...next]);
  };

  const reorder = (from: number | null, to: number | null) => {
    if (from === null || to === null || from === to) return;
    setGallery((current) => {
      const copy = [...current];
      const [moved] = copy.splice(from, 1);
      copy.splice(to, 0, moved);
      return copy;
    });
  };

  const move = (index: number, direction: number) => reorder(index, index + direction);

  const removeAt = (index: number) => {
    setGallery((current) => {
      const item = current[index];
      if (item?.kind === 'new') URL.revokeObjectURL(item.previewUrl);
      return current.filter((_, i) => i !== index);
    });
  };

  const saveBook = useMutation({
    mutationFn: async (data: FieldValues) => {
      const formData = new FormData();

      // Fields derived/transformed below — skip in the main loop
      const SKIP = new Set(['seriesName', 'seriesIndex', 'planAccess']);
      // Enum fields: don't send if empty (avoids enum validation errors)
      const SKIP_EMPTY = new Set(['coverType', 'readingLevel', 'kind']);

      Object.keys(data).forEach((key) => {
        if (SKIP.has(key)) return;
        const val = data[key];
        if (val === undefined || val === null) return;
        if (SKIP_EMPTY.has(key) && val === '') return;
        if (SKIP_EMPTY.has(key) && val === 0) return;
        if (key === 'numPages' && (val === '' || val === 0)) return;
        formData.append(key, String(val));
      });

      formData.append('planAccess', JSON.stringify(data.planAccess ?? []));

      // Serialize series from two fields into one JSON value
      const seriesName = (data.seriesName ?? '').trim();
      formData.append(
        'series',
        seriesName
          ? JSON.stringify({ name: seriesName, index: parseInt(String(data.seriesIndex), 10) || 1 })
          : JSON.stringify(null)
      );

      // Describe the final ordering; append new files in the same order they
      // appear as "new" placeholders so the backend can stitch them together.
      const manifest = gallery.map((item) =>
        item.kind === 'existing'
          ? { type: 'existing', publicId: item.publicId }
          : { type: 'new' }
      );
      formData.append('imageManifest', JSON.stringify(manifest));
      gallery.forEach((item) => {
        if (item.kind === 'new') formData.append('images', item.file);
      });

      if (isEdit) {
        await api.put(`/books/${bookId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/books', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-books'] });
      // Drop every cached view of this book, otherwise reopening the form (or
      // the public page) re-reads the pre-save copy and the new images vanish.
      queryClient.invalidateQueries({ queryKey: ['admin-book', bookId] });
      queryClient.invalidateQueries({ queryKey: ['book', bookId] });
      queryClient.invalidateQueries({ queryKey: ['book-details', bookId] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['featured-books'] });
      toast.success(isEdit ? 'Book updated' : 'Book created');
      navigate('/admin/books');
    },
    onError: (err) =>
      toast.error(
        (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error saving book'
      ),
  });

  const onSubmit = (data: FieldValues) => {
    if (!data.planAccess || data.planAccess.length === 0) {
      toast.error('Select at least one plan');
      return;
    }
    saveBook.mutate(data);
  };

  const fileInput = (
    <input
      type="file"
      accept="image/*"
      multiple
      className="hidden"
      onChange={(e) => {
        addFiles(e.target.files);
        e.target.value = '';
      }}
    />
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-5xl pb-24">
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/admin/books')}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50"
          aria-label="Back to books"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Book' : 'Add New Book'}</h1>
          <p className="text-sm text-gray-400">{isEdit ? 'Update catalogue details and images.' : 'Add a new title to the library catalogue.'}</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        {/* Left: details */}
        <div className="space-y-5">
          <Section title="Book details">
            <div className="space-y-4">
              <Field label="Title">
                <input {...register('title', { required: true })} className={inputCls} placeholder="e.g. The Gruffalo" />
              </Field>
              <Field label="Description">
                <textarea {...register('description', { required: true })} rows={4} className={inputCls} placeholder="Short summary shown to members…" />
              </Field>
              <Field label="Category">
                <select {...register('categoryId', { required: true })} className={inputCls}>
                  <option value="">Select a category…</option>
                  {categories?.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </Field>
            </div>
          </Section>

          <Section title="Audience & access">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Age min">
                  <input type="number" {...register('ageGroupMin', { required: true })} className={inputCls} />
                </Field>
                <Field label="Age max">
                  <input type="number" {...register('ageGroupMax', { required: true })} className={inputCls} />
                </Field>
              </div>

              <div>
                <span className="mb-1.5 block text-sm font-medium text-gray-700">Plan access</span>
                <div className="flex flex-col gap-2 sm:flex-row">
                  {PLANS.map((plan) => {
                    const active = selectedPlans.includes(plan);
                    return (
                      <button
                        type="button"
                        key={plan}
                        onClick={() => togglePlan(plan)}
                        className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                          active
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        {PLAN_DEFINITIONS[plan].label}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1 text-xs text-gray-400">Choose which membership tiers can borrow this title.</p>
              </div>

              <Field label="Total copies" hint="How many physical copies the library holds.">
                <input type="number" min={0} {...register('totalCopies', { required: true })} className={`${inputCls} w-32`} />
              </Field>
            </div>
          </Section>

          <Section title="Series & Metadata" subtitle="Optional — sourced from the physical catalogue. Leave blank if not applicable.">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Series name">
                  <input
                    {...register('seriesName')}
                    className={inputCls}
                    placeholder="e.g. Magic Tree House"
                  />
                </Field>
                <Field label="Book # in series" hint="Leave blank if standalone.">
                  <input
                    type="number"
                    min={1}
                    {...register('seriesIndex')}
                    className={inputCls}
                    placeholder="e.g. 3"
                  />
                </Field>
              </div>

              <Field label="Author">
                <input {...register('author')} className={inputCls} placeholder="e.g. Mary Pope Osborne" />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Pages">
                  <input type="number" min={1} {...register('numPages')} className={inputCls} placeholder="e.g. 96" />
                </Field>
                <Field label="Cover type">
                  <select {...register('coverType')} className={inputCls}>
                    <option value="">— not set —</option>
                    <option value="Hardcover">Hardcover</option>
                    <option value="Softcover">Softcover</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Reading level">
                  <select {...register('readingLevel')} className={inputCls}>
                    <option value="">— not set —</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </Field>
                <Field label="Reading age">
                  <input {...register('readingAge')} className={inputCls} placeholder="e.g. 5–7" />
                </Field>
              </div>

              <Field label="Kind">
                <select {...register('kind')} className={inputCls}>
                  <option value="book">Book</option>
                  <option value="puzzle">Puzzle</option>
                </select>
              </Field>
            </div>
          </Section>
        </div>

        {/* Right: images */}
        <div className="space-y-5">
          <Section title="Images" subtitle="First image is the cover shown everywhere. Drag tiles to reorder.">
            {gallery.length ? (
              <>
                <div className="grid grid-cols-3 gap-2.5">
                  {gallery.map((item, index) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={() => setDragIndex(index)}
                      onDragEnter={() => setOverIndex(index)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        reorder(dragIndex, index);
                        setDragIndex(null);
                        setOverIndex(null);
                      }}
                      onDragEnd={() => {
                        setDragIndex(null);
                        setOverIndex(null);
                      }}
                      className={`group relative overflow-hidden rounded-lg border bg-gray-50 ${
                        overIndex === index && dragIndex !== index
                          ? 'border-primary ring-2 ring-primary'
                          : 'border-gray-200'
                      } ${dragIndex === index ? 'opacity-50' : ''}`}
                    >
                      <div className="relative aspect-square w-full cursor-grab active:cursor-grabbing">
                        <img src={previewSrc(item)} alt={`Image ${index + 1}`} className="h-full w-full object-cover" />
                        {index === 0 && (
                          <span className="absolute left-1 top-1 inline-flex items-center gap-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            <Star className="h-3 w-3" /> Cover
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeAt(index)}
                          aria-label="Remove image"
                          className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition group-hover:opacity-100 hover:bg-red-600"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                        <span className="pointer-events-none absolute bottom-1 left-1 inline-flex items-center gap-1 rounded bg-black/45 px-1 py-0.5 text-[10px] text-white opacity-0 transition group-hover:opacity-100">
                          <GripVertical className="h-3 w-3" /> Drag
                        </span>
                      </div>
                      <div className="flex items-center justify-center gap-1 py-1">
                        <button
                          type="button"
                          onClick={() => move(index, -1)}
                          disabled={index === 0}
                          aria-label="Move earlier"
                          className="inline-flex h-6 w-6 items-center justify-center rounded border border-gray-200 text-gray-500 hover:text-gray-800 disabled:opacity-40"
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          onClick={() => move(index, 1)}
                          disabled={index === gallery.length - 1}
                          aria-label="Move later"
                          className="inline-flex h-6 w-6 items-center justify-center rounded border border-gray-200 text-gray-500 hover:text-gray-800 disabled:opacity-40"
                        >
                          →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <label className="mt-3 flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 py-2.5 text-sm font-medium text-primary hover:border-primary">
                  <Plus className="h-4 w-4" /> Add more images
                  {fileInput}
                </label>
              </>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-12 text-center text-sm text-gray-500 hover:border-primary">
                <ImagePlus className="h-7 w-7 text-gray-400" />
                <span className="font-medium text-gray-700">Upload cover & images</span>
                <span className="text-xs">Pick several at once — drag to reorder later</span>
                {fileInput}
              </label>
            )}
          </Section>
        </div>
      </div>

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <p className="hidden text-sm text-gray-400 sm:block">
            {gallery.length ? `${gallery.length} image${gallery.length === 1 ? '' : 's'} attached` : 'No images yet'}
          </p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => navigate('/admin/books')} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saveBook.isPending} className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {saveBook.isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Create book'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
