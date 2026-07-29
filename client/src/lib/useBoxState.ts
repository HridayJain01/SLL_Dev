import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { IBook, IBorrow, IMembership } from '@/types';
import { getMembershipAllowance, isMembershipActive, PLAN_DEFINITIONS } from '@/lib/plans';
import { bookOf, formatDeliveryWindow, orderRefFromId } from '@/lib/orders';
import { useAuthStore } from '@/store/authStore';
import { useBookBasketStore } from '@/store/bookBasketStore';
import { useWishlistStore } from '@/store/wishlistStore';

/**
 * Shared state for the My Box (383:1601) and Cart (385:2348) screens: the
 * selected titles split by kind, the plan allowance left in this cycle, the
 * row actions, and checkout.
 *
 * The quota maths mirrors `requestBooks` on the server — same cycle window
 * (calendar month) and same per-kind limits — so the button is only enabled
 * when the order will actually be accepted.
 */
export function useBoxState() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const selectedBooks = useBookBasketStore((s) => s.selectedBooks);
  const removeBook = useBookBasketStore((s) => s.removeBook);
  const clearBooks = useBookBasketStore((s) => s.clearBooks);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const wishlist = useWishlistStore((s) => s.wishlist);

  const { data: membership, isLoading: membershipLoading } = useQuery({
    queryKey: ['membership', 'me'],
    queryFn: async () => {
      const res = await api.get('/memberships/me');
      return res.data.membership as IMembership | null;
    },
    enabled: !!user,
  });

  const { data: borrows, isLoading: borrowsLoading } = useQuery({
    queryKey: ['borrows'],
    queryFn: async () => {
      const res = await api.get('/borrows');
      return res.data.borrows as IBorrow[];
    },
    enabled: !!user,
  });

  const books = useMemo(() => selectedBooks.filter((b) => b.kind !== 'puzzle'), [selectedBooks]);
  const puzzles = useMemo(() => selectedBooks.filter((b) => b.kind === 'puzzle'), [selectedBooks]);
  const itemCount = books.length + puzzles.length;

  const isActiveMember = isMembershipActive(membership);
  const allowance = getMembershipAllowance(isActiveMember ? membership : null);

  // Without a membership the card still reads like the design instead of
  // "0 of 0", so fall back to the entry plan's numbers for display only.
  const fallback = PLAN_DEFINITIONS.LITTLE_READER;
  const plan = isActiveMember
    ? {
        label: allowance.label,
        monthlyBookLimit: allowance.monthlyBookLimit,
        monthlyPuzzleLimit: allowance.monthlyPuzzleLimit,
        monthlyTotalLimit: allowance.monthlyTotalLimit,
      }
    : {
        label: fallback.label,
        monthlyBookLimit: fallback.monthlyBookLimit ?? 0,
        monthlyPuzzleLimit: fallback.monthlyPuzzleLimit ?? 0,
        monthlyTotalLimit: fallback.monthlyTotalLimit ?? 0,
      };

  const totalLimit =
    plan.monthlyTotalLimit || (plan.monthlyBookLimit ?? 0) + (plan.monthlyPuzzleLimit ?? 0);

  // Same cycle definition as the server: calendar month, counting borrows that
  // are out or already returned.
  const usage = useMemo(() => {
    const now = new Date();
    const cycleMonth = now.getMonth() + 1;
    const cycleYear = now.getFullYear();
    const cycleBorrows = (borrows ?? []).filter(
      (borrow) =>
        borrow.cycleMonth === cycleMonth &&
        borrow.cycleYear === cycleYear &&
        (borrow.status === 'ACTIVE' || borrow.status === 'RETURNED')
    );
    return {
      total: cycleBorrows.length,
      books: cycleBorrows.filter((borrow) => bookOf(borrow)?.kind !== 'puzzle').length,
      puzzles: cycleBorrows.filter((borrow) => bookOf(borrow)?.kind === 'puzzle').length,
    };
  }, [borrows]);

  const usedTotal = isActiveMember ? usage.total : 0;
  const remainingTotal = Math.max(0, totalLimit - usedTotal);
  const bookSlots = plan.monthlyTotalLimit
    ? remainingTotal
    : Math.max(0, (plan.monthlyBookLimit ?? 0) - (isActiveMember ? usage.books : 0));
  const puzzleSlots = plan.monthlyTotalLimit
    ? remainingTotal
    : Math.max(0, (plan.monthlyPuzzleLimit ?? 0) - (isActiveMember ? usage.puzzles : 0));

  const planSubtitle = plan.monthlyTotalLimit
    ? `${plan.monthlyTotalLimit} books or puzzles / month`
    : plan.monthlyPuzzleLimit
      ? `${plan.monthlyBookLimit} books + ${plan.monthlyPuzzleLimit} puzzles / month`
      : `${plan.monthlyBookLimit} books / month`;

  // The summary card counts against what is left this cycle, not the raw plan
  // limit, so the progress bar can't promise slots that are already spent.
  const bookLimit = remainingTotal;
  const slotsRemaining = Math.max(0, bookLimit - itemCount);

  const overQuota = plan.monthlyTotalLimit
    ? itemCount > remainingTotal
    : books.length > bookSlots || puzzles.length > puzzleSlots;

  let blockedReason: string | null = null;
  if (!user) {
    blockedReason = 'Log in to place your order.';
  } else if (!isActiveMember) {
    blockedReason = membership
      ? 'Your membership is not active right now. Renew it to place an order.'
      : 'Choose a membership plan to place your order.';
  } else if (itemCount === 0) {
    blockedReason = 'Your box is empty — add a book or puzzle first.';
  } else if (overQuota) {
    blockedReason = plan.monthlyTotalLimit
      ? `Your plan has ${remainingTotal} slot(s) left this month, but your box holds ${itemCount}.`
      : `Your plan has ${bookSlots} book slot(s) and ${puzzleSlots} puzzle slot(s) left this month, but your box holds ${books.length} book(s) and ${puzzles.length} puzzle(s).`;
  }

  const checkout = useMutation({
    mutationFn: async () => {
      const res = await api.post('/borrows/request', {
        bookIds: selectedBooks.map((book) => book._id),
      });
      return res.data.borrows as IBorrow[];
    },
    onSuccess: (placed) => {
      clearBooks();
      queryClient.invalidateQueries({ queryKey: ['borrows'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });

      const first = placed?.[0];
      toast.success('Your order has been placed');
      navigate('/order-confirmation', {
        replace: true,
        state: first
          ? {
              orderRef: orderRefFromId(first._id),
              deliveryWindow: formatDeliveryWindow(first.issueDate),
              itemCount: placed.length,
            }
          : null,
      });
    },
    onError: (err: any) => {
      // Titles that vanished between browsing and checkout are dropped from the
      // box so the retry can succeed.
      const missingBookIds = err.response?.data?.missingBookIds as string[] | undefined;
      if (Array.isArray(missingBookIds) && missingBookIds.length > 0) {
        missingBookIds.forEach((bookId) => removeBook(bookId));
        toast.error('Some titles are no longer available and were removed from your box.');
        return;
      }
      toast.error(err.response?.data?.message || 'Could not place your order');
    },
  });

  const onRemove = (book: IBook) => {
    removeBook(book._id);
    toast.success(`${book.title} removed from your box`);
  };

  const onMoveToWishlist = (book: IBook) => {
    if (!wishlist.includes(book._id)) toggleWishlist(book._id);
    removeBook(book._id);
    toast.success(`${book.title} moved to your wishlist`);
  };

  const onCheckout = () => {
    if (blockedReason) {
      toast.error(blockedReason);
      if (!user) navigate('/login');
      else if (!isActiveMember) navigate('/membership');
      return;
    }
    checkout.mutate();
  };

  return {
    isLoading: membershipLoading || borrowsLoading,
    books,
    puzzles,
    booksSelected: itemCount,
    bookLimit,
    slotsRemaining,
    planLabel: plan.label,
    planSubtitle,
    isActiveMember,
    /** Slots already spent this cycle, surfaced under the progress bar. */
    usedThisCycle: usedTotal,
    totalLimit,
    notice:
      blockedReason ??
      (usedTotal > 0
        ? `${usedTotal} of ${totalLimit} slots already used this month.`
        : null),
    checkoutDisabled: Boolean(blockedReason) || checkout.isPending,
    checkoutLabel: checkout.isPending ? 'Placing order…' : 'Proceed to Checkout',
    onCheckout,
    onRemove,
    onMoveToWishlist,
  };
}
