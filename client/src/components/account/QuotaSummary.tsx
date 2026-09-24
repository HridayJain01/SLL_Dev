import { IBorrow } from '@/types';
import { getMembershipAllowance } from '@/lib/plans';
import { bookOf } from '@/lib/orders';

/**
 * "How much can I still order this month?" — shared by the account overview and
 * the membership page. Counts every borrow placed this calendar month whatever
 * stage it is at, same rule as the server, so the two never disagree.
 */
export default function QuotaSummary({
  allowance,
  borrows,
}: {
  allowance: ReturnType<typeof getMembershipAllowance>;
  borrows: IBorrow[];
}) {
  const now = new Date();
  const cycle = borrows.filter(
    (b) => b.cycleMonth === now.getMonth() + 1 && b.cycleYear === now.getFullYear()
  );
  const usedPuzzles = cycle.filter((b) => bookOf(b)?.kind === 'puzzle').length;
  const usedBooks = cycle.length - usedPuzzles;

  const bookLimit = allowance.monthlyBookLimit || 0;
  const puzzleLimit = allowance.monthlyPuzzleLimit || 0;
  const total = allowance.monthlyTotalLimit || bookLimit + puzzleLimit;
  const noun = allowance.monthlyTotalLimit ? 'books or puzzles' : puzzleLimit ? 'items' : 'books';
  const left = Math.max(0, total - cycle.length);
  const progress = total > 0 ? Math.min(100, (cycle.length / total) * 100) : 0;

  const month = now.toLocaleString('en-IN', { month: 'long' });
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="mt-[16px] rounded-[16px] bg-[#f6f8f8] p-[18px]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-body text-[13px] font-semibold leading-[20px] text-night">
          Ordered in {month}
        </span>
        <span className="font-body text-[13px] font-bold leading-[20px] text-lagoon-deep">
          {allowance.monthlyTotalLimit || !puzzleLimit
            ? `${cycle.length} of ${total} used`
            : `${usedBooks} / ${bookLimit} books · ${usedPuzzles} / ${puzzleLimit} puzzles`}
        </span>
      </div>
      <div className="mt-[10px] h-[10px] overflow-hidden rounded-full bg-[#e5e7eb]">
        <div
          className="h-[10px] rounded-full bg-lagoon transition-[width] duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-[10px] font-body text-[13px] leading-[20px] text-slate-muted">
        Your plan lets you order {total} {noun} each calendar month.{' '}
        {left === 0
          ? `You've used all ${total} for ${month} — you can order again from ${nextMonth}.`
          : `You can still order ${left} more in ${month}. Unused slots don't carry over; a fresh ${total} opens on ${nextMonth}.`}
      </p>
    </div>
  );
}
