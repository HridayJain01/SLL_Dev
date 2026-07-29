import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Heart,
  Bell,
  User,
  Star,
  CircleQuestionMark,
} from 'lucide-react';
import api from '@/lib/axios';
import { INotification } from '@/types';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useBookBasketStore } from '@/store/bookBasketStore';
import { useWishlistStore } from '@/store/wishlistStore';

/**
 * Account-area sidebar — Figma node 380:350 / 381:1093.
 * 220px wide, 32/20 padding, pill nav items with 16px lucide icons at 1.2 stroke.
 */
const LINKS = [
  { label: 'Dashboard', to: '/account', icon: LayoutDashboard, end: true },
  { label: 'My Box', to: '/my-box', icon: Package },
  { label: 'Order History', to: '/account/orders', icon: ClipboardList },
  { label: 'Wishlist', to: '/account/wishlist', icon: Heart },
  { label: 'Notifications', to: '/account/notifications', icon: Bell },
  { label: 'My Profile', to: '/account/profile', icon: User },
  { label: 'Membership', to: '/membership', icon: Star },
  { label: 'Help', to: '/faq', icon: CircleQuestionMark },
];

export default function AccountSidebar() {
  const user = useAuthStore((s) => s.user);
  const boxCount = useBookBasketStore((s) => s.selectedBooks.length);
  const wishlistCount = useWishlistStore((s) => s.wishlist.length);
  const initial = (user?.name?.trim()?.[0] ?? 'S').toUpperCase();

  const { data: unreadCount } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications/me');
      return res.data.notifications as INotification[];
    },
    enabled: !!user,
    select: (notifications) => notifications.filter((notification) => !notification.isRead).length,
  });

  /** Live counts on the three entries that can have pending items. */
  const badgeFor = (to: string) => {
    if (to === '/my-box') return boxCount || null;
    if (to === '/account/wishlist') return wishlistCount || null;
    if (to === '/account/notifications') return unreadCount || null;
    return null;
  };

  return (
    /* Under lg this becomes a compact header + horizontally scrollable pill row
       so account navigation stays reachable on a phone. */
    <aside className="w-full shrink-0 border-b border-[#f3f4f6] bg-white px-[16px] py-[16px] lg:w-[220px] lg:border-b-0 lg:px-[20px] lg:py-[32px] lg:shadow-[2px_0px_6px_0px_rgba(0,0,0,0.04)]">
      {/* Account chip */}
      <div className="flex items-center gap-[12px] px-[4px] pb-[16px] lg:pb-[32px]">
        <span className="grid h-[40px] w-[40px] shrink-0 place-items-center rounded-full bg-[#cce8e4] font-body text-[16px] font-bold leading-[24px] text-lagoon-deep lg:h-[44px] lg:w-[44px]">
          {initial}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-heading text-[14px] font-bold leading-[17.5px] text-night">
            {user?.name ?? 'Your account'}
          </span>
          <span className="mt-[2px] block font-body text-[12px] leading-[16px] text-[#9ca3af]">
            Account settings
          </span>
        </span>
      </div>

      <div className="hidden h-px w-[188px] bg-[#f3f4f6] lg:block" />

      <nav className="-mx-[16px] flex items-center gap-[4px] overflow-x-auto px-[16px] pb-[2px] [-ms-overflow-style:none] [scrollbar-width:none] lg:mx-0 lg:mt-[24px] lg:flex-col lg:items-start lg:overflow-x-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden">
        {LINKS.map(({ label, to, icon: Icon, end }) => {
          const badge = badgeFor(to);
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex shrink-0 items-center gap-[8px] whitespace-nowrap rounded-full px-[14px] py-[9px] font-body text-[14px] font-medium leading-[20px] transition-colors lg:w-full lg:gap-[12px] lg:px-[16px] lg:py-[10px]',
                  isActive ? 'bg-chip-blush text-primary' : 'text-[#9ca3af] hover:text-night'
                )
              }
            >
              <Icon className="h-[16px] w-[16px] shrink-0" strokeWidth={1.2} />
              <span className="lg:flex-1">{label}</span>
              {badge && (
                <span className="grid h-[18px] min-w-[18px] shrink-0 place-items-center rounded-full bg-primary px-[5px] font-body text-[10px] font-bold leading-[18px] text-white">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
