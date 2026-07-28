import fire1 from '@/assets/figma/fire-1.svg';
import fire2 from '@/assets/figma/fire-2.svg';
import fire3 from '@/assets/figma/fire-3.svg';
import fire4 from '@/assets/figma/fire-4.svg';

const PROMO_TEXT = 'Get 20% OFF on Your First visit!';

/* The flame is exported as four stacked vector layers; the insets come
   straight from the Figma node so the pieces line up inside the 24px box. */
function FireIcon() {
  return (
    <span className="relative block h-6 w-6 shrink-0 overflow-hidden">
      <span className="absolute inset-[91.67%_26.04%_2.08%_26.04%]">
        <img src={fire1} alt="" className="absolute inset-0 block h-full w-full max-w-none" />
      </span>
      <span className="absolute inset-[45.83%_53.13%_31.04%_30.08%]">
        <span className="absolute inset-[-4.5%_-6.2%]">
          <img src={fire2} alt="" className="block h-full w-full max-w-none" />
        </span>
      </span>
      <span className="absolute inset-[10.42%_17.71%_13.54%_17.71%]">
        <span className="absolute inset-[-1.37%_-1.61%]">
          <img src={fire3} alt="" className="block h-full w-full max-w-none" />
        </span>
      </span>
      <span className="absolute inset-[58.33%_30.61%_21.92%_45.65%]">
        <span className="absolute inset-[-5.27%_-4.39%]">
          <img src={fire4} alt="" className="block h-full w-full max-w-none" />
        </span>
      </span>
    </span>
  );
}

function PromoItems() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <span key={i} className="flex w-[354px] shrink-0 items-center gap-1 pl-[14px]">
          <FireIcon />
          <span className="font-['Poppins'] text-[20px] font-normal leading-9 text-[#daffd3]">
            {PROMO_TEXT}
          </span>
        </span>
      ))}
    </>
  );
}

export default function PromoBar() {
  return (
    <div className="flex h-[53px] w-full items-center overflow-hidden bg-[#0f9ccb]">
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
