import { lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PageTransition from '@/components/PageTransition';
import ProtectedRoute from '@/guards/ProtectedRoute';
import AdminRoute from '@/guards/AdminRoute';
const Login = lazy(() => import('@/pages/Login'));
const Signup = lazy(() => import('@/pages/Signup'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
import Navbar from '@/components/layout/Navbar';
import PromoBar from '@/components/layout/PromoBar';
import Footer from '@/components/layout/Footer';
const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout'));
import AccountLayout from '@/components/account/AccountLayout';

/* Every shell routes its children through <PageTransition /> rather than a bare
   <Outlet />, so navigation cross-fades instead of swapping in one frame.
   PageTransition also owns the scroll reset — see the note in that file. */

const MainLayout = () => (
  <div className="min-h-screen flex flex-col">
    <PromoBar />
    <Navbar />
    <main className="flex-1 bg-background">
      <PageTransition />
    </main>
    <Footer />
  </div>
);

/**
 * Shell for the cart / wishlist screens (Figma "Section 9"): navbar and footer
 * over a white page, with no promo bar.
 */
const ShellLayout = () => (
  <div className="min-h-screen flex flex-col bg-white">
    <Navbar />
    <main className="flex-1 bg-white">
      <PageTransition />
    </main>
    <Footer />
  </div>
);

/** Auth and confirmation screens, which paint their own full-page background. */
const BareLayout = () => <PageTransition distance={10} />;

import Home from '@/pages/Home';
const Library = lazy(() => import('@/pages/Library'));
const BookDetails = lazy(() => import('@/pages/BookDetails'));
const SeriesDetail = lazy(() => import('@/pages/SeriesDetail'));
const Membership = lazy(() => import('@/pages/Membership'));
const About = lazy(() => import('@/pages/About'));
const Cart = lazy(() => import('@/pages/Cart'));
const Wishlist = lazy(() => import('@/pages/Wishlist'));
const OrderConfirmation = lazy(() => import('@/pages/OrderConfirmation'));
const AccountOverview = lazy(() => import('@/pages/account/AccountOverview'));
const AccountBox = lazy(() => import('@/pages/account/AccountBox'));
const AccountOrders = lazy(() => import('@/pages/account/AccountOrders'));
const AccountNotifications = lazy(() => import('@/pages/account/AccountNotifications'));
const AccountProfile = lazy(() => import('@/pages/account/AccountProfile'));
const AccountWishlist = lazy(() => import('@/pages/account/AccountWishlist'));
const AccountMembership = lazy(() => import('@/pages/account/AccountMembership'));
const AccountHelp = lazy(() => import('@/pages/account/AccountHelp'));

const AdminOverview = lazy(() => import('@/pages/admin/AdminOverview'));
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'));
const AdminUserDetail = lazy(() => import('@/pages/admin/AdminUserDetail'));
const AdminBooks = lazy(() => import('@/pages/admin/AdminBooks'));
const AdminBookForm = lazy(() => import('@/pages/admin/AdminBookForm'));
const AdminCategories = lazy(() => import('@/pages/admin/AdminCategories'));
const AdminSeries = lazy(() => import('@/pages/admin/AdminSeries'));
const AdminInventory = lazy(() => import('@/pages/admin/AdminInventory'));
const AdminNotifications = lazy(() => import('@/pages/admin/AdminNotifications'));
const AdminCirculation = lazy(() => import('@/pages/admin/AdminCirculation'));

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/library" element={<Library />} />
          <Route path="/library/:bookId" element={<BookDetails />} />
          <Route path="/series/:slug" element={<SeriesDetail />} />
          <Route path="/membership" element={<Membership />} />
          <Route path="/about" element={<About />} />
          {/* FAQ now lives on the home page; keep old links working. */}
          <Route path="/faq" element={<Navigate to="/#faq" replace />} />
        </Route>

        <Route element={<BareLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        {/* Cart and wishlist — Figma "Section 9" */}
        <Route element={<ProtectedRoute />}>
          <Route element={<ShellLayout />}>
            <Route path="/cart" element={<Cart />} />
            <Route path="/wishlist" element={<Wishlist />} />
          </Route>

          <Route element={<BareLayout />}>
            <Route path="/order-confirmation" element={<OrderConfirmation />} />
          </Route>

          {/* Member dashboard. Everything the sidebar offers lives in here so a
              member never gets bounced out to the marketing site mid-task. */}
          <Route path="/account" element={<AccountLayout />}>
            <Route index element={<AccountOverview />} />
            <Route path="box" element={<AccountBox />} />
            <Route path="orders" element={<AccountOrders />} />
            <Route path="notifications" element={<AccountNotifications />} />
            <Route path="profile" element={<AccountProfile />} />
            <Route path="wishlist" element={<AccountWishlist />} />
            <Route path="membership" element={<AccountMembership />} />
            <Route path="help" element={<AccountHelp />} />
          </Route>
        </Route>

        {/* The old /dashboard and standalone box screens now live under
            /account — keep the URLs working for links already in the wild. */}
        <Route path="/my-box" element={<Navigate to="/account/box" replace />} />
        <Route path="/dashboard" element={<Navigate to="/account" replace />} />
        <Route path="/dashboard/my-books" element={<Navigate to="/account/orders" replace />} />
        <Route path="/dashboard/preferences" element={<Navigate to="/account/box" replace />} />
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
            <Route path="circulation" element={<AdminCirculation />} />
            {/* Return pickups are now one queue inside Circulation. */}
            <Route path="pickups" element={<Navigate to="/admin/circulation" replace />} />
            <Route path="notifications" element={<AdminNotifications />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
