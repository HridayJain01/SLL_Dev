import { NavLink } from 'react-router-dom';
import { Package, ClipboardList, Heart, User, Star, CircleQuestionMark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

/**
 * Account-area sidebar — Figma node 380:350 / 381:1093.
 * 220px wide, 32/20 padding, pill nav items with 16px lucide icons at 1.2 stroke.
 */
const LINKS = [
  { label: 'My Box', to: '/my-box', icon: Package },
  { label: 'Order History', to: '/account/orders', icon: ClipboardList },
  { label: 'Wishlist', to: '/account/wishlist', icon: Heart },
  { label: 'My Profile', to: '/account/profile', icon: User },
  { label: 'Membership', to: '/membership', icon: Star },
  { label: 'Help', to: '/faq', icon: CircleQuestionMark },
];

export default function AccountSidebar() {
  const user = useAuthStore((s) => s.user);
  const initial = (user?.name?.trim()?.[0] ?? 'S').toUpperCase();

  return (
    <aside className="w-[220px] shrink-0 bg-white px-[20px] py-[32px] shadow-[2px_0px_6px_0px_rgba(0,0,0,0.04)]">
      {/* Account chip */}
      <div className="flex items-center gap-[12px] px-[4px] pb-[32px]">
        <span className="grid h-[44px] w-[44px] shrink-0 place-items-center rounded-full bg-[#cce8e4] font-body text-[16px] font-bold leading-[24px] text-lagoon-deep">
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

      <div className="h-px w-[188px] bg-[#f3f4f6]" />

      <nav className="mt-[24px] flex flex-col items-start gap-[4px]">
        {LINKS.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-[12px] rounded-full px-[16px] py-[10px] font-body text-[14px] font-medium leading-[20px] transition-colors',
                isActive ? 'bg-chip-blush text-primary' : 'text-[#9ca3af] hover:text-night'
              )
            }
          >
            <Icon className="h-[16px] w-[16px] shrink-0" strokeWidth={1.2} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
