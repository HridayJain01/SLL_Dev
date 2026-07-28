import { Link, useNavigate, NavLink } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { LogOut, User, Bell, Menu, X, ShoppingCart, Heart } from 'lucide-react';
import api from '@/lib/axios';
import { useBookBasketStore } from '@/store/bookBasketStore';
import { useWishlistStore } from '@/store/wishlistStore';
import logoStar from '@/assets/figma/logo-star.svg';
import logoWordmark from '@/assets/figma/logo-wordmark.svg';
import logoLibrary from '@/assets/figma/logo-library.svg';

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About Us' },
  { to: '/library', label: 'Library' },
  { to: '/membership', label: 'Membership' },
  { to: '/faq', label: 'FAQ' },
];

function Logo() {
  return (
    <Link to="/" className="flex shrink-0 items-center gap-[14px]">
      <img src={logoStar} alt="" className="h-14 w-14" />
      <span className="flex flex-col items-start">
        {/* Explicit widths matched to each SVG's viewBox ratio so the
            preserveAspectRatio="none" exports don't stretch. */}
        <img src={logoWordmark} alt="Star Learners" className="h-[14.676px] w-[130.724px]" />
        <img src={logoLibrary} alt="Library" className="mt-[10px] h-[9.367px] w-[54.44px]" />
      </span>
    </Link>
  );
}

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const basketCount = useBookBasketStore((s) => s.selectedBooks.length);
  const wishlistCount = useWishlistStore((s) => s.wishlist.length);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      logout();
      navigate('/');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#f9f6ef]/95 backdrop-blur-md">
      <div className="mx-auto flex h-[98px] max-w-[1312px] items-center justify-between px-5 lg:px-5">
        <Logo />

        {/* Desktop menu */}
        <div className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `font-heading text-[18px] font-bold leading-[21.6px] transition-colors ${
                  isActive ? 'text-[#ef692b]' : 'text-[#26332d] hover:text-[#ef692b]'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* Right actions. Signed-out visitors see only "Join Now", which is
            what the landing page design shows; the account/basket affordances
            appear once there is a session to act on. */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link
                to="/wishlist"
                className="relative text-ink hover:text-primary"
                aria-label={`Wishlist (${wishlistCount} items)`}
              >
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 w-4 min-w-[16px] items-center justify-center rounded-full bg-[#ff2056] px-0.5 text-[9px] font-bold text-white">
                    {wishlistCount > 9 ? '9+' : wishlistCount}
                  </span>
                )}
              </Link>

              <Link
                to="/cart"
                className="relative text-ink hover:text-primary"
                aria-label={`Cart (${basketCount} books)`}
              >
                <ShoppingCart className="h-5 w-5" />
                {basketCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 w-4 min-w-[16px] items-center justify-center rounded-full bg-[#ff2056] px-0.5 text-[9px] font-bold text-white">
                    {basketCount > 9 ? '9+' : basketCount}
                  </span>
                )}
              </Link>

              <Link
                to={user.role === 'ADMIN' ? '/admin/notifications' : '/dashboard/notifications'}
                className="relative text-ink hover:text-primary"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-danger text-[8px] text-white">
                  !
                </span>
              </Link>
              <Link
                to={user.role === 'ADMIN' ? '/admin' : '/account/profile'}
                className="flex items-center gap-2 font-heading font-bold text-ink hover:text-primary"
              >
                <User className="h-5 w-5" />
                <span className="hidden sm:inline">{user.name.split(' ')[0]}</span>
              </Link>
              <button onClick={handleLogout} className="p-1 text-text-muted transition-colors hover:text-danger">
                <LogOut className="h-5 w-5" />
              </button>
            </>
          ) : (
            <Link
              to="/signup"
              className="hidden h-[56px] w-[165px] items-center justify-center rounded-[50px] bg-[#ef692b] font-heading text-[18px] font-bold leading-[21.6px] text-[#fdfdfd] transition-colors hover:bg-primary-dark sm:inline-flex"
            >
              Join Now
            </Link>
          )}

          <button
            className="text-ink lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-black/5 bg-[#f9f6ef] lg:hidden">
          <div className="mx-auto flex max-w-[1312px] flex-col gap-1 px-5 py-4">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-xl px-3 py-2 font-heading text-[18px] font-bold ${
                    isActive ? 'bg-primary/10 text-[#ef692b]' : 'text-[#26332d]'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            {!user && (
              <Link
                to="/signup"
                onClick={() => setOpen(false)}
                className="mt-2 rounded-[50px] bg-[#ef692b] px-7 py-3 text-center font-heading text-[18px] font-bold text-[#fdfdfd]"
              >
                Join Now
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
