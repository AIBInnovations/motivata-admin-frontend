import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

/**
 * Layout Component
 * Main application layout with responsive sidebar and header
 * Optimized for all screen sizes with smooth transitions
 */
function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    // On mobile, toggle open/closed
    // On desktop, toggle collapsed/expanded
    if (window.innerWidth < 1024) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const closeSidebar = () => setSidebarOpen(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Map routes to menu IDs
  const routeToMenuId = {
    '/dashboard': 'dashboard',
    '/events': 'events',
    '/enrollments': 'enrollments',
    '/coupons': 'coupons',
    '/users': 'users',
    '/admins': 'admins',
    '/payments': 'payments',
    '/cash-tickets': 'cashtickets',
    '/vouchers': 'vouchers',
    '/sessions': 'sessions',
    '/quizes': 'quizes',
    '/challenges': 'challenges',
    '/polls': 'polls',
  };

  const getActiveMenu = () => {
    return routeToMenuId[location.pathname] || 'dashboard';
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-blue-50/30 flex overflow-hidden">
      {/* Mobile Overlay with blur effect */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        activeMenu={getActiveMenu()}
        collapsed={sidebarCollapsed}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={toggleSidebar} />

        {/* Main content with custom scrollbar */}
        <main className="flex-1 overflow-auto custom-scrollbar">
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;
