import { NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Bell,
  CircleQuestionMark,
  ClipboardList,
  Heart,
  LayoutDashboard,
  LogOut,
  Package,
  Star,
  User,
} from 'lucide-react';
import api from '@/lib/axios';
import { INotification } from '@/types';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useBookBasketStore } from '@/store/bookBasketStore';
import { useWishlistStore } from '@/store/wishlistStore';

/**
 * Account-area sidebar.
 *
 * Every entry resolves to an `/account/*` route on purpose — a member should be
 * able to work through the whole dashboard without being thrown back out to the
 * marketing site mid-task. The two links that *do* leave (back to the site, and
 * sign out) are pushed to the foot of the panel and styled as exits so they read
 * as a deliberate choice rather than another nav item.
 */
type NavItem = {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
};

const NAV_GROUPS: Array<{ title?: string; items: NavItem[] }> = [
  {
    items: [{ label: 'Dashboard', to: '/account', icon: LayoutDashboard, end: true }],
  },
  {
    title: 'My library',
    items: [
      { label: 'My Box', to: '/account/box', icon: Package },
      { label: 'Order History', to: '/account/orders', icon: ClipboardList },
      { label: 'Wishlist', to: '/account/wishlist', icon: Heart },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Notifications', to: '/account/notifications', icon: Bell },
      { label: 'My Profile', to: '/account/profile', icon: User },
      { label: 'Membership', to: '/account/membership', icon: Star },
    ],
  },
  {
    title: 'Support',
    items: [{ label: 'Help & Support', to: '/account/help', icon: CircleQuestionMark }],
  },
];

export default function AccountSidebar({
  collapsed = false,
  onNavigate,
  indicatorId = 'accountNavActive',
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
  /** Unique per mounted instance — two sidebars sharing one `layoutId` fight. */
  indicatorId?: string;
}) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const boxCount = useBookBasketStore((s) => s.selectedBooks.length);
  const wishlistCount = useWishlistStore((s) => s.wishlist.length);

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
    if (to === '/account/box') return boxCount || null;
    if (to === '/account/wishlist') return wishlistCount || null;
    if (to === '/account/notifications') return unreadCount || null;
    return null;
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error(err);
    }
    logout();
    onNavigate?.();
    navigate('/');
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-white pb-[20px] pt-[22px]">
      <nav className={cn('flex-1', collapsed ? 'px-[14px]' : 'px-[16px]')}>
        {NAV_GROUPS.map((group, groupIndex) => (
          <div key={group.title ?? groupIndex} className={groupIndex > 0 ? 'mt-[22px]' : undefined}>
            {group.title && (
              <p
                className={cn(
                  'font-body text-[10px] font-bold uppercase leading-[16px] tracking-[1.2px] text-[#9ca3af] transition-opacity',
                  collapsed ? 'h-0 overflow-hidden opacity-0' : 'px-[12px] pb-[8px] opacity-100'
                )}
              >
                {group.title}
              </p>
            )}

            <div className="flex flex-col gap-[2px]">
              {group.items.map(({ label, to, icon: Icon, end }) => {
                const badge = badgeFor(to);
                return (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    onClick={onNavigate}
                    title={collapsed ? label : undefined}
                    className={({ isActive }) =>
                      cn(
                        'group relative flex items-center rounded-[12px] font-body text-[14px] leading-[20px] transition-colors',
                        collapsed ? 'justify-center px-0 py-[11px]' : 'gap-[12px] px-[12px] py-[10px]',
                        isActive
                          ? 'font-semibold text-lagoon-darkest'
                          : 'font-medium text-[#6b7280] hover:bg-[#f7f8f8] hover:text-night'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <motion.span
                            layoutId={indicatorId}
                            transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                            className="absolute inset-0 rounded-[12px] bg-chip-mint"
                          />
                        )}
                        <Icon
                          className="relative z-10 h-[17px] w-[17px] shrink-0"
                          strokeWidth={isActive ? 2 : 1.6}
                        />
                        {!collapsed && <span className="relative z-10 flex-1">{label}</span>}
                        {badge != null && (
                          <span
                            className={cn(
                              'z-10 grid place-items-center rounded-full bg-primary font-body text-[10px] font-bold text-white',
                              collapsed
                                ? 'absolute right-[10px] top-[6px] h-[16px] min-w-[16px] px-[4px] leading-[16px] ring-2 ring-white'
                                : 'relative h-[18px] min-w-[18px] px-[5px] leading-[18px]'
                            )}
                          >
                            {badge > 9 ? '9+' : badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Leaving the dashboard is its own block, below the rule. */}
      <div
        className={cn(
          'mt-[24px] border-t border-[#f1f2f4] pt-[12px]',
          collapsed ? 'px-[14px]' : 'px-[16px]'
        )}
      >
        <NavLink
          to="/"
          onClick={onNavigate}
          title={collapsed ? 'Back to the site' : undefined}
          className={cn(
            'flex items-center rounded-[12px] font-body text-[13px] font-medium leading-[20px] text-[#9ca3af] transition-colors hover:bg-[#f7f8f8] hover:text-night',
            collapsed ? 'justify-center px-0 py-[10px]' : 'gap-[12px] px-[12px] py-[9px]'
          )}
        >
          <ArrowLeft className="h-[16px] w-[16px] shrink-0" strokeWidth={1.6} />
          {!collapsed && <span>Back to the site</span>}
        </NavLink>

        <button
          type="button"
          onClick={handleLogout}
          title={collapsed ? 'Log out' : undefined}
          className={cn(
            'flex w-full items-center rounded-[12px] font-body text-[13px] font-medium leading-[20px] text-[#9ca3af] transition-colors hover:bg-[#fef2f2] hover:text-danger',
            collapsed ? 'justify-center px-0 py-[10px]' : 'gap-[12px] px-[12px] py-[9px]'
          )}
        >
          <LogOut className="h-[16px] w-[16px] shrink-0" strokeWidth={1.6} />
          {!collapsed && <span>Log out</span>}
        </button>
      </div>
    </div>
  );
}
