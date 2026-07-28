import { useNavigate } from 'react-router-dom';
import BoxContents from '@/components/box/BoxContents';
import BoxSummaryCard from '@/components/box/BoxSummaryCard';
import { useBoxState } from '@/lib/useBoxState';

/**
 * Cart — Figma node 385:2348. The nav-bar cart icon opens this: same box
 * contents as My Box, without the page title, and with the wider summary card.
 */
export default function Cart() {
  const navigate = useNavigate();
  const box = useBoxState();

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-[1050px] px-4 pb-[100px] pt-[84px] sm:px-6">
        <div className="flex flex-col gap-[40px] lg:flex-row lg:items-start lg:justify-between">
          <BoxContents
            variant="cart"
            books={box.books}
            puzzles={box.puzzles}
            slotsRemaining={box.slotsRemaining}
            onRemove={box.onRemove}
            onMoveToWishlist={box.onMoveToWishlist}
          />

          <div className="lg:pt-[25px]">
            <BoxSummaryCard
              variant="soft"
              planLabel={box.planLabel}
              planSubtitle={box.planSubtitle}
              booksSelected={box.booksSelected}
              bookLimit={box.bookLimit}
              onCheckout={() => navigate('/order-confirmation')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
