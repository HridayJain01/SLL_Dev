import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { BookOpen, LogOut, User, Bell } from 'lucide-react';
import api from '@/lib/axios';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

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
    <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/80 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2 text-primary hover:text-primary-dark transition-colors">
            <BookOpen className="h-6 w-6" />
            <span className="font-heading font-bold text-xl hidden sm:inline">Star Learners Library</span>
          </Link>

          <div className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-700 hover:text-primary font-medium">Home</Link>
            <Link to="/library" className="text-gray-700 hover:text-primary font-medium">Library</Link>
            <Link to="/membership" className="text-gray-700 hover:text-primary font-medium">Membership</Link>
            <Link to="/about" className="text-gray-700 hover:text-primary font-medium">About</Link>
            <Link to="/faq" className="text-gray-700 hover:text-primary font-medium">FAQ</Link>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} className="relative text-gray-600 hover:text-primary">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-danger text-[8px] text-white">
                    !
                  </span>
                </Link>
                <Link
                  to={user.role === 'ADMIN' ? '/admin' : '/dashboard'}
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary"
                >
                  <User className="h-5 w-5" />
                  <span className="hidden sm:inline font-medium">{user.name.split(' ')[0]}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-danger p-1 rounded-md transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex space-x-3">
                <Link to="/login" className="text-primary hover:text-primary-dark font-medium px-3 py-2">
                  Log in
                </Link>
                <Link to="/signup" className="bg-primary hover:bg-primary-dark text-white font-medium px-4 py-2 rounded-md transition-colors">
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
