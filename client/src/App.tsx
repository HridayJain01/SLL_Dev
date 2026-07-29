import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import ScrollToTop from '@/components/ScrollToTop';
import ProtectedRoute from '@/guards/ProtectedRoute';
import AdminRoute from '@/guards/AdminRoute';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Navbar from '@/components/layout/Navbar';
import PromoBar from '@/components/layout/PromoBar';
import Footer from '@/components/layout/Footer';
import AdminLayout from '@/pages/admin/AdminLayout';
import AccountLayout from '@/components/account/AccountLayout';

const MainLayout = () => (
  <div className="min-h-screen flex flex-col">
    <PromoBar />
    <Navbar />
    <main className="flex-1 bg-background">
      <Outlet />
    </main>
    <Footer />
  </div>
);

/**
 * Shell for the box / wishlist screens (Figma "Section 9"): navbar and footer
 * over a white page, with no promo bar.
 */
const ShellLayout = () => (
  <div className="min-h-screen flex flex-col bg-white">
    <Navbar />
    <main className="flex-1 bg-white">
      <Outlet />
    </main>
    <Footer />
  </div>
);

import Home from '@/pages/Home';
import Library from '@/pages/Library';
import BookDetails from '@/pages/BookDetails';
import SeriesDetail from '@/pages/SeriesDetail';
import Membership from '@/pages/Membership';
import About from '@/pages/About';
import FAQ from '@/pages/FAQ';
import MyBox from '@/pages/MyBox';
import Cart from '@/pages/Cart';
import Wishlist from '@/pages/Wishlist';
import OrderConfirmation from '@/pages/OrderConfirmation';
import AccountOverview from '@/pages/account/AccountOverview';
import AccountOrders from '@/pages/account/AccountOrders';
import AccountNotifications from '@/pages/account/AccountNotifications';
import AccountProfile from '@/pages/account/AccountProfile';
import AccountWishlist from '@/pages/account/AccountWishlist';

import AdminOverview from '@/pages/admin/AdminOverview';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminUserDetail from '@/pages/admin/AdminUserDetail';
import AdminBooks from '@/pages/admin/AdminBooks';
import AdminBookForm from '@/pages/admin/AdminBookForm';
import AdminCategories from '@/pages/admin/AdminCategories';
import AdminSeries from '@/pages/admin/AdminSeries';
import AdminInventory from '@/pages/admin/AdminInventory';
import AdminNotifications from '@/pages/admin/AdminNotifications';
import AdminPickups from '@/pages/admin/AdminPickups';

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Public */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/library" element={<Library />} />
          <Route path="/library/:bookId" element={<BookDetails />} />
          <Route path="/series/:slug" element={<SeriesDetail />} />
          <Route path="/membership" element={<Membership />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Box, cart and wishlist — Figma "Section 9" */}
        <Route element={<ProtectedRoute />}>
          <Route element={<ShellLayout />}>
            <Route path="/my-box" element={<MyBox />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/wishlist" element={<Wishlist />} />
          </Route>

          <Route path="/order-confirmation" element={<OrderConfirmation />} />

          {/* Member dashboard */}
          <Route path="/account" element={<AccountLayout />}>
            <Route index element={<AccountOverview />} />
            <Route path="orders" element={<AccountOrders />} />
            <Route path="notifications" element={<AccountNotifications />} />
            <Route path="profile" element={<AccountProfile />} />
            <Route path="wishlist" element={<AccountWishlist />} />
          </Route>
        </Route>

        {/* The old /dashboard screens now live under /account — keep the URLs
            working for bookmarks and links already in the wild. */}
        <Route path="/dashboard" element={<Navigate to="/account" replace />} />
        <Route path="/dashboard/my-books" element={<Navigate to="/account/orders" replace />} />
        <Route path="/dashboard/preferences" element={<Navigate to="/my-box" replace />} />
        <Route
          path="/dashboard/notifications"
          element={<Navigate to="/account/notifications" replace />}
        />

        {/* Admin */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="users/:userId" element={<AdminUserDetail />} />
            <Route path="books" element={<AdminBooks />} />
            <Route path="books/new" element={<AdminBookForm />} />
            <Route path="books/:bookId/edit" element={<AdminBookForm />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="series" element={<AdminSeries />} />
            <Route path="inventory" element={<AdminInventory />} />
            <Route path="pickups" element={<AdminPickups />} />
            <Route path="notifications" element={<AdminNotifications />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
