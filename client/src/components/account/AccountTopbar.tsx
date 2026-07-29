import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bell, Menu, Package } from 'lucide-react';
import api from '@/lib/axios';
import { INotification } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useBookBasketStore } from '@/store/bookBasketStore';
import logoStar from '@/assets/figma/logo-star.svg';

/**
 * Dashboard header. Deliberately *not* the marketing `Navbar`: the member area
 * is its own product surface, and the site nav is a set of links straight back
 * out of it. The only way out is the explicit "Back to the site" entry at the
 * foot of the sidebar.
 */
export default function AccountTopbar({ onOpenNav }: { onOpenNav: () => void }) {
  const user = useAuthStore((s) => s.user);
  const boxCount = useBookBasketStore((s) => s.selectedBooks.length);
  const initial = (user?.name?.trim()?.[0] ?? 'S').toUpperCase();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications/me');
      return res.data.notifications as INotification[];
    },
    enabled: !!user,
    select: (notifications) => notifications.filter((notification) => !notification.isRead).length,
  });

  return (
    <header className="sticky top-0 z-40 bg-lagoon-darkest">
      <div className="mx-auto flex h-[64px] w-full max-w-[1440px] items-center gap-2 px-4 sm:px-6">
        <button
          type="button"
          onClick={onOpenNav}
          aria-label="Open dashboard menu"
          className="-ml-2 grid h-10 w-10 shrink-0 place-items-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link to="/account" className="flex min-w-0 items-center gap-[10px]">
          <img src={logoStar} alt="" className="h-9 w-9 shrink-0" />
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-heading text-[15px] font-extrabold leading-[19px] text-white">
              Star Learners
            </span>
            <span className="hidden font-body text-[10px] font-semibold uppercase leading-[14px] tracking-[1.3px] text-white/55 sm:block">
              Member dashboard
            </span>
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <TopbarIcon
            to="/account/box"
            label={`My box (${boxCount} items)`}
            badge={boxCount}
            icon={<Package className="h-[18px] w-[18px]" strokeWidth={1.7} />}
          />
          <TopbarIcon
            to="/account/notifications"
            label={`Notifications (${unreadCount} unread)`}
            badge={unreadCount}
            icon={<Bell className="h-[18px] w-[18px]" strokeWidth={1.7} />}
          />

          <Link
            to="/account/profile"
            className="ml-1 flex items-center gap-[8px] rounded-full py-[4px] pl-[4px] pr-[4px] transition-colors hover:bg-white/10 sm:pr-[14px]"
          >
            <span className="grid h-[32px] w-[32px] shrink-0 place-items-center rounded-full bg-white/15 font-body text-[13px] font-bold leading-[32px] text-white">
              {initial}
            </span>
            <span className="hidden max-w-[120px] truncate font-body text-[13px] font-semibold leading-[20px] text-white sm:block">
              {user?.name?.split(' ')[0] ?? 'Account'}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}

function TopbarIcon({
  to,
  label,
  icon,
  badge,
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
  badge: number;
}) {
  return (
    <Link
      to={to}
      aria-label={label}
      className="relative grid h-10 w-10 place-items-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
    >
      {icon}
      {badge > 0 && (
        <span className="absolute right-[5px] top-[5px] grid h-[16px] min-w-[16px] place-items-center rounded-full bg-primary px-[4px] font-body text-[9px] font-bold leading-[16px] text-white ring-2 ring-lagoon-darkest">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  );
}
