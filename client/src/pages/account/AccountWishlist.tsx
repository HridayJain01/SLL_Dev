import WishlistGrid from '@/components/wishlist/WishlistGrid';
import { useWishlistBooks } from '@/lib/useWishlistBooks';

/**
 * Wishlist inside the account area — Figma node 381:1088. Same grid as the
 * standalone screen, with the two-line count heading beside the sidebar.
 */
export default function AccountWishlist() {
  const { count } = useWishlistBooks();

  return (
    <div className="px-4 pb-[100px] pt-[46px] sm:px-[18px]">
      <p className="font-body text-[16px] font-medium leading-[24px] tracking-[-0.3125px] text-slate-label">
        My Wishlist
        <br />
        {count} {count === 1 ? 'item' : 'items'}
      </p>

      <div className="mt-[13px]">
        <WishlistGrid gap="tight" />
      </div>
    </div>
  );
}
