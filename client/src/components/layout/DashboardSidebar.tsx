import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookMarked, Heart, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DashboardSidebar() {
  const links = [
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard, exact: true },
    { name: 'My Books', path: '/dashboard/my-books', icon: BookMarked },
    { name: 'Preferences', path: '/dashboard/preferences', icon: Heart },
    { name: 'Notifications', path: '/dashboard/notifications', icon: Bell },
  ];

  return (
    <aside className="w-full md:w-64 flex-shrink-0 bg-white border-r border-gray-100 min-h-[calc(100vh-4rem)] p-4">
      <nav className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.exact}
              className={({ isActive }) =>
                cn(
                  'flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary-dark'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )
              }
            >
              <Icon className="h-5 w-5" />
              <span>{link.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
