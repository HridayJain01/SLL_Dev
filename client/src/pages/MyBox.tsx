import BoxContents from '@/components/box/BoxContents';
import BoxSummaryCard from '@/components/box/BoxSummaryCard';
import { useBoxState } from '@/lib/useBoxState';

/**
 * "My Box" — Figma node 383:1601 ("Add to box").
 * Reached from the account sidebar; carries the page title and subtitle.
 */
export default function MyBox() {
  const box = useBoxState();

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-[981px] px-4 pb-[80px] pt-[56px] sm:px-6">
        <header>
          <h1 className="font-heading text-[36px] font-extrabold leading-[32px] text-night">My Box</h1>
          <p className="max-w-[512px] pt-[4px] font-jakarta text-[16px] leading-[22.75px] text-clay">
            Build this month's delivery by adding books and puzzles to your box. Fill your plan before
            checkout.
          </p>
        </header>

        <div className="mt-[22px] flex flex-col gap-[40px] lg:flex-row lg:items-start lg:justify-between">
          <BoxContents
            variant="box"
            books={box.books}
            puzzles={box.puzzles}
            slotsRemaining={box.slotsRemaining}
            onRemove={box.onRemove}
            onMoveToWishlist={box.onMoveToWishlist}
          />

          <div className="lg:pt-[95px]">
            <BoxSummaryCard
              variant="pill"
              planLabel={box.planLabel}
              planSubtitle={box.planSubtitle}
              booksSelected={box.booksSelected}
              bookLimit={box.bookLimit}
              notice={box.notice}
              checkoutDisabled={box.checkoutDisabled}
              checkoutLabel={box.checkoutLabel}
              onCheckout={box.onCheckout}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
