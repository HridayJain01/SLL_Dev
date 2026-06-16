import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const AGE_GROUPS = [
  { range: '2–3', label: 'Toddlers', blurb: 'Board books & first words', emoji: '🧸', bg: 'bg-chip-rose' },
  { range: '4–5', label: 'Pre-schoolers', blurb: 'Picture books & rhymes', emoji: '🎨', bg: 'bg-chip-mint' },
  { range: '6–7', label: 'Early readers', blurb: 'Stories & easy chapters', emoji: '📚', bg: 'bg-chip-sky' },
  { range: '8+', label: 'Confident readers', blurb: 'Chapter books & puzzles', emoji: '🚀', bg: 'bg-chip-indigo' },
];

export default function BrowseByAge() {
  return (
    <section className="bg-white py-16 lg:py-24">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="font-body text-[18px] font-medium uppercase tracking-[2px] text-primary-light">Browse by age</p>
          <h2 className="mx-auto mt-3 max-w-[820px] font-heading text-[32px] font-extrabold leading-[1.1] tracking-[-1px] text-ink sm:text-[42px] lg:text-[48px]">
            Books &amp; puzzles curated for every stage of growth
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {AGE_GROUPS.map((g) => (
            <Link
              key={g.range}
              to="/library"
              className="group rounded-[24px] border border-black/5 bg-cream p-6 transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <div className={`flex h-[160px] items-center justify-center rounded-[18px] ${g.bg} text-7xl`}>
                <span>{g.emoji}</span>
              </div>
              <p className="mt-5 inline-block rounded-full bg-primary/10 px-3 py-1 font-heading text-sm font-bold text-primary">
                {g.range} yrs
              </p>
              <h3 className="mt-3 font-heading text-[22px] font-extrabold text-ink">{g.label}</h3>
              <p className="mt-1 text-[16px] font-medium text-text-muted">{g.blurb}</p>
              <span className="mt-4 inline-flex items-center gap-1 font-heading text-sm font-bold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Explore <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
