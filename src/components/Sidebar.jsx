import { useState } from "react";
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
  Shield,
  Briefcase,
  CreditCard,
  FileText,
  UserCheck,
  UserPlus,
  PenSquare,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import MotivataLogo from "../assets/logo/Motivata.png";
import MotivataLogoSmall from "../assets/logo/logo2.png";

/**
 * Sidebar Component
 * Modern, responsive sidebar with nested menu structure
 */
function Sidebar({ collapsed, isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, admin } = useAuth();
  const [expandedSections, setExpandedSections] = useState({
    clubs: true,
    services: true,
    engagement: true,
  });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // Check if path is active
  const isActivePath = (path) => location.pathname === path;

  // Check if any child in section is active
  const isSectionActive = (children) => {
    return children?.some((child) => isActivePath(child.path));
  };

  const menuStructure = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
      type: "single",
    },
    {
      id: "events",
      label: "Events",
      icon: Calendar,
      path: "/events",
      type: "single",
    },
    {
      id: "users",
      label: "Users",
      icon: UserCog,
      path: "/users",
      type: "single",
    },
    {
      id: "admins",
      label: "Admins",
      icon: ShieldCheck,
      path: "/admins",
      type: "single",
    },
    {
      id: "clubs",
      label: "Clubs & Connect",
      icon: UsersRound,
      type: "section",
      children: [
        {
          id: "clubs-manage",
          label: "Manage Clubs",
          icon: UsersRound,
          path: "/clubs",
        },
        {
          id: "club-join-requests",
          label: "Join Requests",
          icon: UserPlus,
          path: "/club-join-requests",
        },
        {
          id: "admin-club-posts",
          label: "Create Post",
          icon: PenSquare,
          path: "/admin-club-posts",
        },
      ],
    },
    {
      id: "engagement",
      label: "Engagement",
      icon: BarChart3,
      type: "section",
      children: [
        {
          id: "sessions",
          label: "Sessions",
          icon: Video,
          path: "/sessions",
        },
        {
          id: "quizes",
          label: "Quizes",
          icon: ClipboardList,
          path: "/quizes",
        },
        {
          id: "challenges",
          label: "Challenges",
          icon: Trophy,
          path: "/challenges",
        },
        {
          id: "polls",
          label: "Polls",
          icon: BarChart3,
          path: "/polls",
        },
        {
          id: "stories",
          label: "Stories",
          icon: ImagePlay,
          path: "/stories",
        },
      ],
    },
    {
      id: "services",
      label: "Services",
      icon: Briefcase,
      type: "section",
      children: [
        {
          id: "services-manage",
          label: "Manage Services",
          icon: Briefcase,
          path: "/services",
        },
        {
          id: "service-orders",
          label: "Orders",
          icon: CreditCard,
          path: "/service-orders",
        },
        {
          id: "service-requests",
          label: "Requests",
          icon: FileText,
          path: "/service-requests",
        },
      ],
    },
    {
      id: "memberships",
      label: "Memberships",
      icon: Crown,
      path: "/memberships",
      type: "single",
    },
    {
      id: "user-subscriptions",
      label: "Subscriptions",
      icon: UserCheck,
      path: "/user-subscriptions",
      type: "single",
    },
    {
      id: "cashtickets",
      label: "Cash Tickets",
      icon: Banknote,
      path: "/cash-tickets",
      type: "single",
    },
    {
      id: "vouchers",
      label: "Vouchers",
      icon: Gift,
      path: "/vouchers",
      type: "single",
    },
    {
      id: "scan-qr",
      label: "Scan QR",
      icon: ScanLine,
      path: "/scan-qr",
      type: "single",
    },
    {
      id: "ticket-reshare",
      label: "Ticket Reshare",
      icon: Share2,
      path: "/ticket-reshare",
      type: "single",
    },
    {
      id: "feature-access",
      label: "Feature Access",
      icon: Shield,
      path: "/feature-access",
      type: "single",
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      path: "/settings",
      type: "single",
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

  const renderMenuItem = (item) => {
    if (item.type === "single") {
      const isActive = isActivePath(item.path);
      return (
        <li key={item.id}>
          <Link
            to={item.path}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
              transition-all duration-200 group relative
              ${
                isActive
                  ? "bg-gray-900 text-white shadow-md"
                  : "text-gray-700 hover:bg-gray-100"
              }
              ${collapsed ? "lg:justify-center lg:px-2" : ""}
            `}
            title={collapsed ? item.label : ""}
          >
            <item.icon
              className={`
                h-4 w-4 shrink-0 transition-transform duration-200
                ${isActive ? "scale-110" : "group-hover:scale-105"}
              `}
            />
            {!collapsed && (
              <span className="font-medium text-sm truncate">
                {item.label}
              </span>
            )}
          </Link>
        </li>
      );
    }

    if (item.type === "section") {
      const isExpanded = expandedSections[item.id];
      const hasActiveChild = isSectionActive(item.children);

      return (
        <li key={item.id} className="space-y-1">
          {/* Section Header */}
          <button
            onClick={() => toggleSection(item.id)}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
              transition-all duration-200 group
              ${
                hasActiveChild
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-700 hover:bg-gray-50"
              }
              ${collapsed ? "lg:justify-center lg:px-2" : ""}
            `}
            title={collapsed ? item.label : ""}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && (
              <>
                <span className="font-semibold text-sm truncate flex-1 text-left">
                  {item.label}
                </span>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0" />
                )}
              </>
            )}
          </button>

          {/* Section Children */}
          {!collapsed && isExpanded && (
            <ul className="ml-3 pl-3 border-l-2 border-gray-200 space-y-1">
              {item.children.map((child) => {
                const isActive = isActivePath(child.path);
                return (
                  <li key={child.id}>
                    <Link
                      to={child.path}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2 rounded-lg
                        transition-all duration-200 group
                        ${
                          isActive
                            ? "bg-gray-900 text-white shadow-md"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        }
                      `}
                    >
                      <child.icon className="h-4 w-4 shrink-0" />
                      <span className="font-medium text-sm truncate">
                        {child.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </li>
      );
    }
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
          <div
            className={`flex flex-col ${
              collapsed ? "items-center" : "items-start"
            } min-w-0 flex-1`}
          >
            <img
              src={collapsed ? MotivataLogoSmall : MotivataLogo}
              alt="Motivata"
              className={`${collapsed ? "h-12 w-12" : "h-16"} object-contain`}
            />
            {!collapsed && (
              <p className="text-xs text-gray-500 font-medium -mt-1 ml-4">
                Admin Panel
              </p>
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
          {menuStructure.map((item) => renderMenuItem(item))}
        </ul>
      </nav>

      {/* Profile & Logout Section - Fixed at bottom */}
      <div className="border-t border-gray-200/80 shrink-0 bg-white/50 backdrop-blur-sm">
        {/* Profile Section */}
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

        {/* Logout Button */}
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
