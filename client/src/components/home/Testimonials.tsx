import { Star } from 'lucide-react';

export default function Testimonials() {
  const testimonials = [
    {
      name: 'Priya Sharma',
      role: 'Mother of a 4-year-old',
      text: "Star Learners Library has completely changed my daughter's reading habits. The quality of books is amazing, and the WhatsApp system is so convenient!",
    },
    {
      name: 'Rahul Desai',
      role: 'Father of two',
      text: 'The Premium plan is totally worth it. The puzzles keep my son engaged for hours, and the delivery process is smooth and hassle-free.',
    },
    {
      name: 'Anita Verma',
      role: 'Mother of an 8-year-old',
      text: "I love the wide variety of categories. My kid is currently obsessed with the science books. It's affordable and highly recommended.",
    },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-heading font-bold text-center text-gray-900 mb-12">Loved by Parents</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, index) => (
            <div key={index} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex text-amber-400 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-6 italic">"{t.text}"</p>
              <div>
                <p className="font-bold text-gray-900">{t.name}</p>
                <p className="text-sm text-gray-500">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
