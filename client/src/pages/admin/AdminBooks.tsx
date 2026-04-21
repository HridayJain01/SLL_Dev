import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { IBook } from '@/types';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Trash2, Edit } from 'lucide-react';

export default function AdminBooks() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-books'],
    queryFn: async () => {
      const res = await api.get('/books');
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

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Books</h1>
        <Link to="/admin/books/new" className="bg-primary text-white px-4 py-2 rounded-lg font-medium">Add New Book</Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Copies (Total/Avail)</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data?.map((book) => (
              <tr key={book._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <img src={book.coverImage || 'https://placehold.co/50x75?text=Img'} className="h-10 w-8 object-cover rounded mr-3" />
                    <div className="text-sm font-medium text-gray-900">{book.title}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {typeof book.categoryId === 'object' ? book.categoryId.name : ''}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{book.ageGroupMin}-{book.ageGroupMax}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{book.totalCopies} / {book.availableCopies}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                  <Link to={`/admin/books/${book._id}/edit`} className="text-blue-600 hover:text-blue-900"><Edit className="h-4 w-4 inline" /></Link>
                  <button onClick={() => { if(confirm('Delete book?')) deleteBook.mutate(book._id); }} className="text-red-600 hover:text-red-900">
                    <Trash2 className="h-4 w-4 inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
