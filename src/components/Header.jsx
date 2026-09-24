import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const getInitials = (name) =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

/**
 * Header Component
 * Clean, minimal header with search and notifications
 * Profile removed - now in sidebar above logout button
 */
function Header({ toggleSidebar }) {
  const navigate = useNavigate();
  const { logout, admin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const displayName = admin?.name || admin?.username || 'Admin';
  const displayEmail = admin?.email || '';
  const displayRole = admin?.role || 'Administrator';

  useEffect(() => {
    if (!menuOpen) return undefined;

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [menuOpen]);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/login');
  };

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
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((open) => !open)}
          className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-full hover:bg-gray-100 transition-colors"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="Account menu"
        >
          <span className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-800 via-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            {getInitials(displayName)}
          </span>
          <span className="hidden md:flex flex-col items-start leading-tight">
            <span className="text-sm font-semibold text-gray-900 max-w-[160px] truncate">
              {displayName}
            </span>
            <span className="text-[11px] text-gray-500">{displayRole}</span>
          </span>
          <ChevronDown
            className={`h-4 w-4 text-gray-500 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-40"
          >
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-bold text-gray-900 truncate">{displayName}</p>
              {displayEmail && (
                <p className="text-xs text-gray-600 truncate">{displayEmail}</p>
              )}
              <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-100 text-gray-900 border border-blue-200">
                {displayRole}
              </span>
            </div>
            <button
              role="menuitem"
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
