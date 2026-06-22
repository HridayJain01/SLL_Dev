const PROMO_TEXT = 'Get 20% OFF on Your First visit!';

function PromoItems() {
  // Render a handful of copies so the strip fills wide screens before it loops.
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <span key={i} className="flex items-center gap-2 px-8">
          <span aria-hidden>🔥</span>
          <span className="font-heading text-[15px] font-bold tracking-tight">{PROMO_TEXT}</span>
        </span>
      ))}
    </>
  );
}

export default function PromoBar() {
  return (
    <div className="w-full overflow-hidden bg-[#3DA9DC] py-2.5 text-white">
      <div className="flex w-max animate-marquee whitespace-nowrap">
        {/* Two identical halves: animating -50% creates a seamless loop. */}
        <div className="flex shrink-0">
          <PromoItems />
        </div>
        <div className="flex shrink-0" aria-hidden>
          <PromoItems />
        </div>
      </div>
    </div>
  );
}
