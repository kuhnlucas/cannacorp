import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  BarChart3, 
  Beaker, 
  Home, 
  Monitor, 
  Package, 
  Settings, 
  Sprout,
  Database
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Labs', href: '/labs', icon: Settings },
  { name: 'Genetics', href: '/genetics', icon: Sprout },
  { name: 'Batches', href: '/batches', icon: Package },
  { name: 'Monitoring', href: '/monitoring', icon: Monitor },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
];

export default function Sidebar() {
  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Beaker className="h-8 w-8 text-green-600" />
          <span className="text-lg font-bold text-gray-900 dark:text-white">CannabisHub</span>
        </div>
      </div>
      
      <nav className="mt-8 px-4">
        <div className="space-y-2">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}