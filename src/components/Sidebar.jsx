import {
  LayoutDashboard,
  Calendar,
  UserCog,
  ShieldCheck,
  Banknote,
  Gift,
  X,
  LogOut,
  Video,
  ClipboardList,
  Trophy,
  BarChart3,
  ImagePlay,
  ScanLine,
  Share2,
  Crown,
  UsersRound,
  Settings,
  Briefcase,
  CreditCard,
  FileText,
  UserCheck,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import MotivataLogo from "../assets/logo/Motivata.png";
import MotivataLogoSmall from "../assets/logo/logo2.png";

/**
 * Sidebar Component
 * Modern, responsive sidebar with profile section above logout
 * Implements CRAP principles: Contrast, Repetition, Alignment, Proximity
 */
function Sidebar({ activeMenu, collapsed, isOpen, onClose }) {
  const navigate = useNavigate();
  const { logout, admin } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
      color: "blue",
    },
    {
      id: "events",
      label: "Events",
      icon: Calendar,
      path: "/events",
      color: "purple",
    },
    {
      id: "users",
      label: "Users",
      icon: UserCog,
      path: "/users",
      color: "green",
    },
    {
      id: "admins",
      label: "Admins",
      icon: ShieldCheck,
      path: "/admins",
      color: "orange",
    },
    {
      id: "cashtickets",
      label: "Cash Tickets",
      icon: Banknote,
      path: "/cash-tickets",
      color: "cyan",
    },
    {
      id: "vouchers",
      label: "Vouchers",
      icon: Gift,
      path: "/vouchers",
      color: "pink",
    },
    {
      id: "sessions",
      label: "Sessions",
      icon: Video,
      path: "/sessions",
      color: "indigo",
    },
    {
      id: "quizes",
      label: "Quizes",
      icon: ClipboardList,
      path: "/quizes",
      color: "amber",
    },
    {
      id: "challenges",
      label: "Challenges",
      icon: Trophy,
      path: "/challenges",
      color: "emerald",
    },
    {
      id: "polls",
      label: "Polls",
      icon: BarChart3,
      path: "/polls",
      color: "rose",
    },
    {
      id: "stories",
      label: "Stories",
      icon: ImagePlay,
      path: "/stories",
      color: "sky",
    },
    {
      id: "memberships",
      label: "Memberships",
      icon: Crown,
      path: "/memberships",
      color: "slate",
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      path: "/settings",
      color: "gray",
    },
    {
      id: "clubs",
      label: "Clubs",
      icon: UsersRound,
      path: "/clubs",
      color: "fuchsia",
    },
    {
      id: "scan-qr",
      label: "Scan QR",
      icon: ScanLine,
      path: "/scan-qr",
      color: "teal",
    },
    {
      id: "ticket-reshare",
      label: "Ticket Reshare",
      icon: Share2,
      path: "/ticket-reshare",
      color: "violet",
    },
    {
      id: "services",
      label: "Services",
      icon: Briefcase,
      path: "/services",
      color: "blue",
    },
    {
      id: "service-orders",
      label: "Service Orders",
      icon: CreditCard,
      path: "/service-orders",
      color: "green",
    },
    {
      id: "service-requests",
      label: "Service Requests",
      icon: FileText,
      path: "/service-requests",
      color: "amber",
    },
    {
      id: "user-subscriptions",
      label: "Subscriptions",
      icon: UserCheck,
      path: "/user-subscriptions",
      color: "purple",
    },
  ];

  // Get display name or fallback
  const displayName = admin?.name || admin?.username || "Admin";
  const displayEmail = admin?.email || "admin@motivata.com";
  const displayRole = admin?.role || "Administrator";

  // Get initials for avatar
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside
      className={`
        ${collapsed ? "lg:w-20" : "lg:w-72"}
        fixed lg:static inset-y-0 left-0 z-50
        w-72
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        bg-gradient-to-b from-white to-gray-50/50
        border-r border-gray-200
        shadow-2xl lg:shadow-none
        flex flex-col
        transition-all duration-300 ease-in-out
        h-screen
        overflow-hidden
      `}
    >
      {/* Header with Logo and Close Button */}
      <div className="p-5 lg:p-6 border-b border-gray-200/80 shrink-0 bg-white/80 backdrop-blur-sm">
        <div className="flex items-start justify-between">
          <div className={`flex flex-col ${collapsed ? 'items-center' : 'items-start'} min-w-0 flex-1`}>
            <img
              src={collapsed ? MotivataLogoSmall : MotivataLogo}
              alt="Motivata"
              className={`${collapsed ? 'h-12 w-12' : 'h-16'} object-contain`}
            />
            {!collapsed && (
              <p className="text-xs text-gray-500 font-medium -mt-1 ml-4">Admin Panel</p>
            )}
          </div>

          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-all active:scale-95"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Navigation - Scrollable */}
      <nav className="flex-1 p-3 lg:p-4 overflow-y-auto overflow-x-hidden custom-scrollbar">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = activeMenu === item.id;
            return (
              <li key={item.id}>
                <Link
                  to={item.path}
                  className={`
                    w-full flex items-center gap-3 px-3 py-3 rounded-xl
                    transition-all duration-200 group relative
                    ${
                      isActive
                        ? "bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg shadow-gray-500/30"
                        : "text-gray-700 hover:bg-gray-100/80 hover:translate-x-1"
                    }
                    ${collapsed ? "lg:justify-center lg:px-2" : ""}
                  `}
                  title={collapsed ? item.label : ""}
                >
                  <item.icon
                    className={`
                      h-5 w-5 shrink-0 transition-transform duration-200
                      ${isActive ? "scale-110" : "group-hover:scale-110"}
                    `}
                  />
                  {!collapsed && (
                    <span className="font-semibold text-sm truncate">
                      {item.label}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Profile & Logout Section - Fixed at bottom */}
      <div className="border-t border-gray-200/80 shrink-0 bg-white/50 backdrop-blur-sm">
        {/* Profile Section - Now ABOVE logout */}
        <div className={`p-4 ${collapsed ? "lg:p-2" : ""}`}>
          <div
            className={`
              flex items-center gap-3 p-3 rounded-xl
              bg-gradient-to-br from-gray-50 to-gray-100/50
              border border-gray-200/50
              transition-all duration-200 hover:shadow-md
              ${collapsed ? "lg:justify-center lg:p-2" : ""}
            `}
            title={collapsed ? `${displayName} - ${displayRole}` : ""}
          >
            {/* Avatar with initials */}
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 via-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white">
                {getInitials(displayName)}
              </div>
              {/* Online status indicator */}
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm" />
            </div>

            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {displayName}
                </p>
                <p className="text-xs text-gray-600 truncate">{displayEmail}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-100 text-gray-900 border border-blue-200">
                    {displayRole}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Logout Button - Now BELOW profile */}
        <div className="p-4 pt-0">
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
              bg-gradient-to-r from-red-50 to-red-100/50
              text-red-600 font-semibold text-sm
              border border-red-200
              hover:from-red-100 hover:to-red-200/50
              hover:border-red-300 hover:shadow-md
              active:scale-[0.98]
              transition-all duration-200
              group
              ${collapsed ? "lg:px-2" : ""}
            `}
            title="Logout"
          >
            <LogOut className="h-4 w-4 shrink-0 group-hover:scale-110 transition-transform" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
