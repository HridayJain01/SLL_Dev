import { Link, useNavigate, NavLink } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { LogOut, User, Bell, Menu, X } from 'lucide-react';
import api from '@/lib/axios';
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
    <Link to="/" className="flex items-center gap-3">
      <img src={logoStar} alt="" className="h-10 w-10" />
      <span className="flex flex-col leading-none">
        <img src={logoWordmark} alt="Star Learners" className="h-[15px] w-auto" />
        <img src={logoLibrary} alt="Library" className="mt-[6px] h-[10px] w-auto self-start" />
      </span>
    </Link>
  );
}

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

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
    <nav className="sticky top-0 z-50 w-full bg-cream/90 backdrop-blur-md">
      <div className="mx-auto flex h-[82px] max-w-[1360px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        {/* Desktop menu */}
        <div className="hidden items-center gap-9 lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `font-heading text-[18px] font-bold transition-colors ${
                  isActive ? 'text-primary' : 'text-ink hover:text-primary'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
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
                to={user.role === 'ADMIN' ? '/admin' : '/dashboard'}
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
              className="hidden rounded-full bg-primary px-7 py-3 font-heading text-[18px] font-bold text-white shadow-sm transition-colors hover:bg-primary-dark sm:inline-block"
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
        <div className="border-t border-black/5 bg-cream lg:hidden">
          <div className="mx-auto flex max-w-[1360px] flex-col gap-1 px-4 py-4">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-xl px-3 py-2 font-heading text-[18px] font-bold ${
                    isActive ? 'bg-primary/10 text-primary' : 'text-ink'
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
                className="mt-2 rounded-full bg-primary px-7 py-3 text-center font-heading text-[18px] font-bold text-white"
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
