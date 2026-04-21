import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import ProtectedRoute from '@/guards/ProtectedRoute';
import AdminRoute from '@/guards/AdminRoute';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import DashboardLayout from '@/pages/dashboard/DashboardLayout';
import AdminLayout from '@/pages/admin/AdminLayout';

const MainLayout = () => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-1 bg-background">
      <Outlet />
    </main>
    <Footer />
  </div>
);

import Home from '@/pages/Home';
import Library from '@/pages/Library';
import BookDetails from '@/pages/BookDetails';
import Membership from '@/pages/Membership';
import About from '@/pages/About';
import FAQ from '@/pages/FAQ';

import DashboardOverview from '@/pages/dashboard/DashboardOverview';
import MyBooks from '@/pages/dashboard/MyBooks';
import Preferences from '@/pages/dashboard/Preferences';
import DashboardNotifications from '@/pages/dashboard/DashboardNotifications';

import AdminOverview from '@/pages/admin/AdminOverview';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminUserDetail from '@/pages/admin/AdminUserDetail';
import AdminBooks from '@/pages/admin/AdminBooks';
import AdminBookForm from '@/pages/admin/AdminBookForm';
import AdminCategories from '@/pages/admin/AdminCategories';
import AdminInventory from '@/pages/admin/AdminInventory';
import AdminNotifications from '@/pages/admin/AdminNotifications';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/library" element={<Library />} />
          <Route path="/library/:bookId" element={<BookDetails />} />
          <Route path="/membership" element={<Membership />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
        </Route>
        
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Dashboard — logged-in users */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardOverview />} />
            <Route path="my-books" element={<MyBooks />} />
            <Route path="preferences" element={<Preferences />} />
            <Route path="notifications" element={<DashboardNotifications />} />
          </Route>
        </Route>

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
            <Route path="inventory" element={<AdminInventory />} />
            <Route path="notifications" element={<AdminNotifications />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
