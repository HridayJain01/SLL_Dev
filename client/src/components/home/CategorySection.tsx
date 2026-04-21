import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { ICategory } from '@/types';
import { Link } from 'react-router-dom';

export default function CategorySection() {
  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data.categories as ICategory[];
    },
  });

  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-heading font-bold text-gray-900 mb-10">Explore by Category</h2>
        
        {isLoading ? (
          <div className="flex flex-wrap justify-center gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-200 h-12 w-32 rounded-full" />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-4">
            {categories?.map((cat) => (
              <Link
                key={cat._id}
                to={`/library?category=${cat._id}`}
                className="bg-white border border-gray-200 hover:border-primary hover:shadow-md px-6 py-3 rounded-full flex items-center space-x-2 transition-all hover:-translate-y-1"
              >
                <span className="text-2xl">{cat.iconEmoji}</span>
                <span className="font-medium text-gray-800">{cat.name}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
