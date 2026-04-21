import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, Tags, Archive, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminSidebar() {
  const links = [
    { name: 'Overview', path: '/admin', icon: LayoutDashboard, exact: true },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Books', path: '/admin/books', icon: BookOpen },
    { name: 'Categories', path: '/admin/categories', icon: Tags },
    { name: 'Inventory', path: '/admin/inventory', icon: Archive },
    { name: 'Notifications', path: '/admin/notifications', icon: Bell },
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
                    ? 'bg-secondary/10 text-secondary-dark'
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
