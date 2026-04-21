import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { ICategory, IBook } from '@/types';

export default function AdminBookForm() {
  const { bookId } = useParams<{ bookId: string }>();
  const isEdit = !!bookId;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset } = useForm();
  const [file, setFile] = useState<File | null>(null);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data.categories as ICategory[];
    },
  });

  useQuery({
    queryKey: ['book', bookId],
    queryFn: async () => {
      const res = await api.get(`/books/${bookId}`);
      const b = res.data.book as IBook;
      reset({
        title: b.title,
        description: b.description,
        ageGroupMin: b.ageGroupMin,
        ageGroupMax: b.ageGroupMax,
        categoryId: typeof b.categoryId === 'object' ? b.categoryId._id : b.categoryId,
        planAccess: b.planAccess,
        totalCopies: b.totalCopies,
      });
      return b;
    },
    enabled: isEdit,
  });

  const saveBook = useMutation({
    mutationFn: async (data: any) => {
      const formData = new FormData();
      Object.keys(data).forEach((key) => {
        if (key === 'planAccess') {
          formData.append(key, JSON.stringify(data[key]));
        } else {
          formData.append(key, data[key]);
        }
      });
      if (file) formData.append('coverImage', file);

      if (isEdit) {
        await api.put(`/books/${bookId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/books', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-books'] });
      toast.success(isEdit ? 'Book updated' : 'Book created');
      navigate('/admin/books');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error saving book'),
  });

  const onSubmit = (data: any) => saveBook.mutate(data);

  return (
    <div className="max-w-2xl bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h1 className="text-2xl font-bold mb-6">{isEdit ? 'Edit Book' : 'Add New Book'}</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div><label className="block text-sm font-medium mb-1">Title</label><input {...register('title', { required: true })} className="w-full border p-2 rounded" /></div>
        <div><label className="block text-sm font-medium mb-1">Description</label><textarea {...register('description', { required: true })} className="w-full border p-2 rounded" rows={4} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1">Age Min</label><input type="number" {...register('ageGroupMin', { required: true })} className="w-full border p-2 rounded" /></div>
          <div><label className="block text-sm font-medium mb-1">Age Max</label><input type="number" {...register('ageGroupMax', { required: true })} className="w-full border p-2 rounded" /></div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select {...register('categoryId', { required: true })} className="w-full border p-2 rounded">
            {categories?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Plan Access</label>
          <select multiple {...register('planAccess', { required: true })} className="w-full border p-2 rounded" size={2}>
            <option value="NORMAL">NORMAL</option>
            <option value="PREMIUM">PREMIUM</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
        </div>
        <div><label className="block text-sm font-medium mb-1">Total Copies</label><input type="number" {...register('totalCopies', { required: true })} className="w-full border p-2 rounded" /></div>
        <div>
          <label className="block text-sm font-medium mb-1">Cover Image</label>
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full border p-2 rounded" accept="image/*" />
        </div>
        <div className="flex justify-end space-x-2 pt-4">
          <button type="button" onClick={() => navigate('/admin/books')} className="px-4 py-2 border rounded">Cancel</button>
          <button type="submit" disabled={saveBook.isPending} className="px-4 py-2 bg-primary text-white rounded">{saveBook.isPending ? 'Saving...' : 'Save Book'}</button>
        </div>
      </form>
    </div>
  );
}
