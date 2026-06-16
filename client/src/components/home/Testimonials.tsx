import { Star, Quote } from 'lucide-react';

const TESTIMONIALS = [
  {
    name: 'Priya Sharma',
    role: 'Mum of Aarav, 4',
    text: 'My daughter went from screen tantrums to asking for one more book at bedtime. The monthly swaps keep things exciting!',
    card: 'bg-chip-mint',
  },
  {
    name: 'Rahul Desai',
    role: 'Dad of two',
    text: 'No more clutter of books they outgrow in a month. We borrow, enjoy and return — brilliant for small homes.',
    card: 'bg-chip-sky',
  },
  {
    name: 'Anita Verma',
    role: 'Mum of Kiara, 8',
    text: 'The age-based picks are spot on. Delivery is quick and the puzzles are a hit on weekends.',
    card: 'bg-chip-rose',
  },
];

const AVATARS = ['Priya', 'Rahul', 'Anita', 'Sneha', 'Vikram', 'Meera'];

export default function Testimonials() {
  return (
    <section className="bg-navy py-16 text-white lg:py-24">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="font-body text-[18px] font-medium uppercase tracking-[2px] text-primary-light">Loved by families</p>
          <h2 className="mx-auto mt-3 max-w-[760px] font-heading text-[32px] font-extrabold leading-[1.1] tracking-[-1px] sm:text-[42px] lg:text-[48px]">
            Why Parents Love Star Learners
          </h2>
        </div>

        {/* Avatar strip */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <div className="flex -space-x-3">
            {AVATARS.map((a) => (
              <img
                key={a}
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(a)}&background=random&color=fff&size=96`}
                alt={a}
                className="h-12 w-12 rounded-full border-2 border-navy object-cover"
              />
            ))}
          </div>
          <span className="text-sm font-semibold text-white/70">2,000+ happy families</span>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className={`relative rounded-[24px] ${t.card} p-7 text-ink`}>
              <Quote className="h-8 w-8 text-primary/40" />
              <div className="mt-2 flex text-primary">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-current" />
                ))}
              </div>
              <p className="mt-4 text-[17px] font-medium leading-relaxed text-ink/90">“{t.text}”</p>
              <div className="mt-6 flex items-center gap-3">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=EF692B&color=fff&size=80`}
                  alt={t.name}
                  className="h-11 w-11 rounded-full object-cover"
                />
                <div>
                  <p className="font-heading text-[16px] font-extrabold text-ink">{t.name}</p>
                  <p className="text-sm font-medium text-ink/60">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
