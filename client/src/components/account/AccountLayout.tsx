import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AccountSidebar from '@/components/account/AccountSidebar';

/**
 * Shell for the account screens — Figma nodes 380:230 (My Profile) and
 * 381:1088 (Wishlist): white sidebar on the left, white content pane on the
 * right, with the collapse toggle pinned to the sidebar edge.
 */
export default function AccountLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />

      <div className="relative flex flex-1 flex-col items-stretch lg:flex-row">
        {/* The collapse toggle is a desktop affordance; on mobile the sidebar is
            always shown as a strip above the content. */}
        <div className={collapsed ? 'lg:w-0 lg:overflow-hidden' : undefined}>
          <AccountSidebar />
        </div>

        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? 'Expand account menu' : 'Collapse account menu'}
          aria-expanded={!collapsed}
          className="absolute top-[39px] z-10 hidden h-[30px] w-[30px] place-items-center rounded-[7px] border-2 border-[#e5e7eb] bg-[#fefefe] p-[2px] text-[#6b6f85] transition-colors hover:text-night lg:grid"
          style={{ left: collapsed ? 4 : 205 }}
        >
          {collapsed ? (
            <ChevronRight className="h-[20px] w-[20px]" strokeWidth={1.6} />
          ) : (
            <ChevronLeft className="h-[20px] w-[20px]" strokeWidth={1.6} />
          )}
        </button>

        <main className="min-w-0 flex-1 lg:border-l lg:border-[#f3f4f6]">
          <Outlet />
        </main>
      </div>

      <Footer />
    </div>
  );
}
