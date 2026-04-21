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
      
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex space-x-2">
        <input placeholder="Name" value={newCat.name} onChange={e => setNewCat({...newCat, name: e.target.value})} className="border p-2 rounded flex-1" />
        <input placeholder="Slug" value={newCat.slug} onChange={e => setNewCat({...newCat, slug: e.target.value})} className="border p-2 rounded flex-1" />
        <input placeholder="Emoji" value={newCat.iconEmoji} onChange={e => setNewCat({...newCat, iconEmoji: e.target.value})} className="border p-2 rounded w-20" />
        <button onClick={() => createCat.mutate()} className="bg-primary text-white px-4 rounded">Add</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Icon</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data?.map(cat => (
              <tr key={cat._id}>
                <td className="px-6 py-4 text-xl">{cat.iconEmoji}</td>
                <td className="px-6 py-4 text-sm">{cat.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{cat.slug}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => { if(confirm('Delete?')) deleteCat.mutate(cat._id); }} className="text-red-600 hover:text-red-900 text-sm">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
