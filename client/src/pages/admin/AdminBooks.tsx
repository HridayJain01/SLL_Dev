import { useState, useMemo, Fragment } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { IBook } from '@/types';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Trash2, Edit, ChevronDown, ChevronRight } from 'lucide-react';

const categoryName = (book: IBook) =>
  typeof book.categoryId === 'object' && book.categoryId ? book.categoryId.name : '';

export default function AdminBooks() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

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
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Books{' '}
          <span className="text-base font-normal text-gray-400">
            ({filtered.length}{data && filtered.length !== data.length ? ` of ${data.length}` : ''})
          </span>
        </h1>
        <div className="flex items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, code, category, author…"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-72"
          />
          <Link to="/admin/books/new" className="bg-primary text-white px-4 py-2 rounded-lg font-medium whitespace-nowrap">
            Add New Book
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-8" />
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Copies</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.map((book) => {
              const isOpen = expanded === book._id;
              return (
                <Fragment key={book._id}>
                  <tr className="hover:bg-gray-50">
                    <td className="pl-3">
                      <button onClick={() => setExpanded(isOpen ? null : book._id)} className="text-gray-400 hover:text-gray-700">
                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-gray-500">{book.shelfCode || '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <img src={book.coverImage || 'https://placehold.co/50x75?text=Img'} className="h-10 w-8 object-cover rounded mr-3 bg-gray-100" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{book.title}</div>
                          {book.series && (
                            <div className="text-xs text-gray-400">{book.series.name} #{book.series.index}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{categoryName(book)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {book.kind === 'puzzle' ? (
                        <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">Puzzle</span>
                      ) : (
                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">Book</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{book.ageGroupMin}-{book.ageGroupMax}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{book.author || '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{book.totalCopies} / {book.availableCopies ?? '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <Link to={`/admin/books/${book._id}/edit`} className="text-blue-600 hover:text-blue-900"><Edit className="h-4 w-4 inline" /></Link>
                      <button onClick={() => { if (confirm('Delete book?')) deleteBook.mutate(book._id); }} className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-4 w-4 inline" />
                      </button>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="bg-gray-50/60">
                      <td />
                      <td colSpan={8} className="px-4 py-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-sm">
                          <Detail label="Box" value={book.box} />
                          <Detail label="Reading age" value={book.readingAge} />
                          <Detail label="Reading level" value={book.readingLevel} />
                          <Detail label="Cover type" value={book.coverType} />
                          <Detail label="Pages" value={book.numPages} />
                          {book.kind === 'puzzle' && <Detail label="Pieces" value={book.pieceCount} />}
                          {book.kind === 'puzzle' && <Detail label="Material" value={book.material} />}
                          <Detail label="Plans" value={book.planAccess?.join(', ')} />
                          <Detail label="Images" value={book.images?.length ? `${book.images.length} uploaded` : 'none yet'} />
                        </div>
                        {book.description && (
                          <p className="mt-3 text-sm text-gray-600"><span className="font-medium text-gray-700">Description: </span>{book.description}</p>
                        )}
                        {book.keywords && book.keywords.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {book.keywords.map((k, i) => (
                              <span key={i} className="bg-white border border-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">{k}</span>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
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
