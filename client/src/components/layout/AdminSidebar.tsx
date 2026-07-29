import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, Tags, Layers, Archive, Bell, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminSidebar() {
  const links = [
    { name: 'Overview', path: '/admin', icon: LayoutDashboard, exact: true },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Books', path: '/admin/books', icon: BookOpen },
    { name: 'Categories', path: '/admin/categories', icon: Tags },
    { name: 'Series', path: '/admin/series', icon: Layers },
    { name: 'Inventory', path: '/admin/inventory', icon: Archive },
    { name: 'Return Pickups', path: '/admin/pickups', icon: Truck },
    { name: 'Notifications', path: '/admin/notifications', icon: Bell },
  ];

  return (
    /* Below md the nav collapses into a horizontally scrollable tab strip so it
       costs one row instead of a screenful of links above the content. */
    <aside className="w-full flex-shrink-0 border-b border-gray-100 bg-white p-3 md:min-h-[calc(100vh-4rem)] md:w-64 md:border-b-0 md:border-r md:p-4">
      <nav className="-mx-3 flex gap-1 overflow-x-auto px-3 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:mx-0 md:flex-col md:space-y-1 md:overflow-x-visible md:px-0 md:pb-0 [&::-webkit-scrollbar]:hidden">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.exact}
              className={({ isActive }) =>
                cn(
                  'flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition-colors md:gap-3 md:px-4 md:py-3',
                  isActive
                    ? 'bg-secondary/10 text-secondary-dark'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )
              }
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span>{link.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
