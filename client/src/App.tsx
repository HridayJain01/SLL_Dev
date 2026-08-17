import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PageTransition from '@/components/PageTransition';
import ProtectedRoute from '@/guards/ProtectedRoute';
import AdminRoute from '@/guards/AdminRoute';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Navbar from '@/components/layout/Navbar';
import PromoBar from '@/components/layout/PromoBar';
import Footer from '@/components/layout/Footer';
import AdminLayout from '@/pages/admin/AdminLayout';
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
import Library from '@/pages/Library';
import BookDetails from '@/pages/BookDetails';
import SeriesDetail from '@/pages/SeriesDetail';
import Membership from '@/pages/Membership';
import About from '@/pages/About';
import FAQ from '@/pages/FAQ';
import Cart from '@/pages/Cart';
import Wishlist from '@/pages/Wishlist';
import OrderConfirmation from '@/pages/OrderConfirmation';
import AccountOverview from '@/pages/account/AccountOverview';
import AccountBox from '@/pages/account/AccountBox';
import AccountOrders from '@/pages/account/AccountOrders';
import AccountNotifications from '@/pages/account/AccountNotifications';
import AccountProfile from '@/pages/account/AccountProfile';
import AccountWishlist from '@/pages/account/AccountWishlist';
import AccountMembership from '@/pages/account/AccountMembership';
import AccountHelp from '@/pages/account/AccountHelp';

import AdminOverview from '@/pages/admin/AdminOverview';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminUserDetail from '@/pages/admin/AdminUserDetail';
import AdminBooks from '@/pages/admin/AdminBooks';
import AdminBookForm from '@/pages/admin/AdminBookForm';
import AdminCategories from '@/pages/admin/AdminCategories';
import AdminSeries from '@/pages/admin/AdminSeries';
import AdminInventory from '@/pages/admin/AdminInventory';
import AdminNotifications from '@/pages/admin/AdminNotifications';
import AdminCirculation from '@/pages/admin/AdminCirculation';

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
          <Route path="/faq" element={<FAQ />} />
        </Route>

        <Route element={<BareLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
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
