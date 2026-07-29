import WishlistGrid from '@/components/wishlist/WishlistGrid';
import { useWishlistBooks } from '@/lib/useWishlistBooks';
import { AccountPage, AccountPageHeader, Card } from '@/components/account/AccountCard';

/**
 * Wishlist inside the account area — Figma node 381:1088. Same grid as the
 * standalone screen, wearing the dashboard's page header so it matches the rest
 * of the member area.
 */
export default function AccountWishlist() {
  const { count } = useWishlistBooks();

  return (
    <AccountPage>
      <AccountPageHeader
        title="Wishlist"
        subtitle={`${count} ${count === 1 ? 'title' : 'titles'} saved for later.`}
      />

      <Card className="p-[22px] sm:p-[26px]">
        <WishlistGrid gap="tight" />
      </Card>
    </AccountPage>
  );
}
