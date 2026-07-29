import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import BoxContents from '@/components/box/BoxContents';
import BoxSummaryCard from '@/components/box/BoxSummaryCard';
import { useBoxState } from '@/lib/useBoxState';
import { AccountPage, AccountPageHeader, Card } from '@/components/account/AccountCard';

/**
 * "My Box" inside the dashboard — the same box the standalone `/my-box` screen
 * used to show, now framed by the account shell so building a box and checking
 * out never leaves the member area.
 */
export default function AccountBox() {
  const box = useBoxState();

  return (
    <AccountPage>
      <AccountPageHeader
        title="My Box"
        subtitle="Build this month's delivery, then check out when you're happy with it."
        action={
          <Link
            to="/account/wishlist"
            className="inline-flex shrink-0 items-center gap-[8px] rounded-full border border-[#e5e7eb] bg-white px-[18px] py-[10px] font-body text-[14px] font-semibold leading-[20px] text-night transition-colors hover:border-lagoon-deep hover:text-lagoon-deep"
          >
            <Heart className="h-[15px] w-[15px]" strokeWidth={1.7} />
            From wishlist
          </Link>
        }
      />

      <div className="flex flex-col gap-[20px] lg:flex-row lg:items-start">
        <Card className="min-w-0 flex-1 p-[22px] sm:p-[26px]">
          <BoxContents
            variant="box"
            books={box.books}
            puzzles={box.puzzles}
            slotsRemaining={box.slotsRemaining}
            onRemove={box.onRemove}
            onMoveToWishlist={box.onMoveToWishlist}
          />
        </Card>

        <div className="lg:sticky lg:top-[84px] lg:w-[288px] lg:shrink-0">
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
    </AccountPage>
  );
}
