import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import AccountSidebar from '@/components/account/AccountSidebar';
import AccountTopbar from '@/components/account/AccountTopbar';

const RAIL_EXPANDED = 236;
const RAIL_COLLAPSED = 74;
const COLLAPSE_KEY = 'sll:account-nav-collapsed';

/**
 * Shell for the member dashboard.
 *
 * It runs its own chrome — dashboard topbar, persistent rail, tinted canvas —
 * instead of the marketing navbar and footer, so the account area reads as a
 * separate product surface rather than another page of the website.
 */
export default function AccountLayout() {
  const { pathname } = useLocation();
  const reduceMotion = useReducedMotion();
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== 'undefined' && window.localStorage.getItem(COLLAPSE_KEY) === '1'
  );
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  // The drawer closes on link clicks, but not on a browser back/forward.
  useEffect(() => setNavOpen(false), [pathname]);

  useEffect(() => {
    if (!navOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNavOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [navOpen]);

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f7f7]">
      <AccountTopbar onOpenNav={() => setNavOpen(true)} />

      <div className="mx-auto flex w-full max-w-[1440px] flex-1 items-stretch">
        <motion.aside
          initial={false}
          animate={{ width: collapsed ? RAIL_COLLAPSED : RAIL_EXPANDED }}
          transition={
            reduceMotion ? { duration: 0 } : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
          }
          className="relative hidden shrink-0 border-r border-[#e9ecec] bg-white lg:block"
        >
          <div className="sticky top-[64px] h-[calc(100vh-64px)]">
            <AccountSidebar collapsed={collapsed} indicatorId="accountNavDesktop" />

            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              aria-label={collapsed ? 'Expand dashboard menu' : 'Collapse dashboard menu'}
              aria-expanded={!collapsed}
              className="absolute -right-[13px] top-[16px] z-20 grid h-[26px] w-[26px] place-items-center rounded-full border border-[#e5e7eb] bg-white text-[#9ca3af] shadow-[0_2px_6px_rgba(0,0,0,0.08)] transition-colors hover:text-lagoon-deep"
            >
              {collapsed ? (
                <ChevronRight className="h-[15px] w-[15px]" strokeWidth={2} />
              ) : (
                <ChevronLeft className="h-[15px] w-[15px]" strokeWidth={2} />
              )}
            </button>
          </div>
        </motion.aside>

        <main className="min-w-0 flex-1">
          <PageTransition distance={10} />
        </main>
      </div>

      <footer className="border-t border-[#e9ecec] bg-white">
        <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-2 px-4 py-[18px] sm:px-6">
          <p className="font-body text-[12px] leading-[18px] text-[#9ca3af]">
            © {new Date().getFullYear()} Star Learners Library
          </p>
          <Link
            to="/account/help"
            className="font-body text-[12px] font-semibold leading-[18px] text-[#9ca3af] transition-colors hover:text-lagoon-deep"
          >
            Need a hand?
          </Link>
        </div>
      </footer>

      {/* Mobile: the rail becomes a drawer so the dashboard keeps its full nav
          on a phone instead of a truncated pill row. */}
      <AnimatePresence>
        {navOpen && (
          <>
            <motion.div
              key="scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setNavOpen(false)}
              className="fixed inset-0 z-40 bg-night/45 lg:hidden"
            />
            <motion.div
              key="drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Dashboard menu"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { type: 'spring', stiffness: 400, damping: 40, mass: 0.8 }
              }
              className="fixed inset-y-0 left-0 z-50 flex w-[276px] max-w-[85vw] flex-col bg-white shadow-[8px_0_32px_rgba(0,0,0,0.18)] lg:hidden"
            >
              <div className="flex h-[64px] shrink-0 items-center justify-between border-b border-[#f1f2f4] px-[18px]">
                <span className="font-heading text-[14px] font-extrabold leading-[20px] text-night">
                  Member dashboard
                </span>
                <button
                  type="button"
                  onClick={() => setNavOpen(false)}
                  aria-label="Close dashboard menu"
                  className="-mr-2 grid h-9 w-9 place-items-center rounded-full text-[#9ca3af] transition-colors hover:bg-[#f7f8f8] hover:text-night"
                >
                  <X className="h-[18px] w-[18px]" />
                </button>
              </div>
              <div className="min-h-0 flex-1">
                <AccountSidebar onNavigate={() => setNavOpen(false)} indicatorId="accountNavMobile" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
