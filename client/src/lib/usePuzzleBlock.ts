import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { IBook, IMembership } from '@/types';
import { getMembershipAllowance, isMembershipActive } from '@/lib/plans';
import { useAuthStore } from '@/store/authStore';

/**
 * Why this item can't go in the box, or null when it can. Today that is only a
 * puzzle on a plan with no puzzle allowance (Little Reader) — the server refuses
 * the order anyway, but the member should find out at "Add", not at checkout.
 */
export function usePuzzleBlock() {
  const user = useAuthStore((s) => s.user);
  const { data: membership } = useQuery({
    queryKey: ['membership', 'me'],
    queryFn: async () => {
      const res = await api.get('/memberships/me');
      return res.data.membership as IMembership | null;
    },
    enabled: !!user,
  });

  const allowance = isMembershipActive(membership) ? getMembershipAllowance(membership) : null;
  // A plan with a shared total (Star Reader) reports its puzzle limit as 0 too,
  // so only a plan with neither is closed to puzzles.
  const noPuzzles = !!allowance && !allowance.monthlyPuzzleLimit && !allowance.monthlyTotalLimit;

  return (book: Pick<IBook, 'kind'>): string | null =>
    noPuzzles && book.kind === 'puzzle'
      ? `${allowance!.label} doesn't include puzzles. Upgrade to Star Reader or Wonder Bundle to borrow them.`
      : null;
}
