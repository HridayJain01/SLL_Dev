import WishlistGrid from '@/components/wishlist/WishlistGrid';
import { useWishlistBooks } from '@/lib/useWishlistBooks';

/**
 * Wishlist — Figma node 385:1978. Opened from the nav-bar heart icon
 * ("when you click on nav bar icons"), so it runs full width without the
 * account sidebar.
 */
export default function Wishlist() {
  const { count } = useWishlistBooks();

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-[1312px] px-4 pb-[120px] pt-[85px] sm:px-6">
        <p className="mb-[42px] font-body text-[16px] font-medium leading-[24px] tracking-[-0.3125px] text-slate-label">
          My Wishlist {count} {count === 1 ? 'item' : 'items'}
        </p>

        <WishlistGrid gap="wide" />
      </div>
    </div>
  );
}
