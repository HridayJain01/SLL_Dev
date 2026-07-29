import PageTransition from '@/components/PageTransition';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AdminSidebar from '@/components/layout/AdminSidebar';

export default function AdminLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        <AdminSidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <PageTransition distance={10} />
        </main>
      </div>
      <Footer />
    </div>
  );
}
