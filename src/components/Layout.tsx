import React from 'react';
import { Outlet } from 'react-router-dom';
import MobileNav from './MobileNav';
import Header from './Header';

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation (handles both mobile and desktop) */}
      <MobileNav />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}