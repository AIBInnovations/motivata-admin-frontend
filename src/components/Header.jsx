import { useState } from 'react';
import { Bell, Search, X } from 'lucide-react';

/**
 * Header Component
 * Clean, minimal header with search and notifications
 * Profile removed - now in sidebar above logout button
 */
function Header({ toggleSidebar }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 lg:px-6 py-3 lg:py-4 flex items-center justify-between flex-shrink-0 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-3 lg:gap-4 flex-1">
        {/* Menu Toggle - Desktop shows icon, always visible */}
        <button
          onClick={toggleSidebar}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all hover:scale-105 active:scale-95 group"
          aria-label="Toggle Sidebar"
        >
          <div className="relative h-6 w-6">
            <span className="absolute left-0 top-1 w-6 h-0.5 bg-gray-600 rounded transition-all group-hover:w-5" />
            <span className="absolute left-0 top-3 w-6 h-0.5 bg-gray-600 rounded" />
            <span className="absolute left-0 top-5 w-6 h-0.5 bg-gray-600 rounded transition-all group-hover:w-4" />
          </div>
        </button>

        {/* Page Greeting - Hidden on mobile */}
        <div className="hidden lg:block">
          <h1 className="text-lg font-bold text-gray-900 tracking-tight">
            Welcome back
          </h1>
          <p className="text-xs text-gray-500">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* Search Bar - Desktop */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search anything..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-64 lg:w-80 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all placeholder:text-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-200 rounded"
            >
              <X className="h-3.5 w-3.5 text-gray-400" />
            </button>
          )}
        </div>

        {/* Search Button - Mobile */}
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all active:scale-95"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </button>

        {/* Notifications */}
        <button
          className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all hover:scale-105 active:scale-95 group"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell className="h-5 w-5 group-hover:animate-pulse" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white" />
          {/* Notification count badge */}
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
            3
          </span>
        </button>
      </div>

      {/* Mobile Search Overlay */}
      {searchOpen && (
        <div className="md:hidden fixed inset-x-0 top-[57px] bg-white border-b border-gray-200 p-4 shadow-lg z-40 animate-in slide-in-from-top">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search anything..."
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            />
            <button
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
