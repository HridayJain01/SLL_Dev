import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { ICategory } from '@/types';
import { toast } from 'sonner';

export default function AdminCategories() {
  const queryClient = useQueryClient();
  const [newCat, setNewCat] = useState({ name: '', slug: '', iconEmoji: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data.categories as ICategory[];
    },
  });

  const createCat = useMutation({
    mutationFn: async () => {
      await api.post('/categories', newCat);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setNewCat({ name: '', slug: '', iconEmoji: '' });
      toast.success('Category created');
    },
  });

  const deleteCat = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deleted');
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Categories</h1>
      
      <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:flex sm:items-center">
        <input placeholder="Name" value={newCat.name} onChange={e => setNewCat({...newCat, name: e.target.value})} className="col-span-2 min-w-0 rounded border p-2 sm:flex-1" />
        <input placeholder="Slug" value={newCat.slug} onChange={e => setNewCat({...newCat, slug: e.target.value})} className="col-span-2 min-w-0 rounded border p-2 sm:flex-1" />
        <input placeholder="Emoji" value={newCat.iconEmoji} onChange={e => setNewCat({...newCat, iconEmoji: e.target.value})} className="min-w-0 rounded border p-2 sm:w-20" />
        <button onClick={() => createCat.mutate()} className="rounded bg-primary px-4 py-2.5 font-medium text-white sm:py-2">Add</button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 sm:px-6">Icon</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 sm:px-6">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 sm:px-6">Slug</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500 sm:px-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {data?.map(cat => (
                <tr key={cat._id}>
                  <td className="px-4 py-4 text-xl sm:px-6">{cat.iconEmoji}</td>
                  <td className="px-4 py-4 text-sm sm:px-6">{cat.name}</td>
                  <td className="px-4 py-4 text-sm text-gray-500 sm:px-6">{cat.slug}</td>
                  <td className="px-4 py-4 text-right sm:px-6">
                    <button onClick={() => { if(confirm('Delete?')) deleteCat.mutate(cat._id); }} className="text-sm text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
