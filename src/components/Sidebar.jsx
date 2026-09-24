import { useState } from "react";
import {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  BarChart2,
  Ticket,
  UserCog,
  ShieldCheck,
  Banknote,
  Gift,
  Tag,
  X,
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
  SlidersHorizontal,
  CreditCard,
  FileText,
  UserCheck,
  UserPlus,
  PenSquare,
  ChevronDown,
  ChevronRight,
  Users,
  Zap,
  CircleDot,
  Globe,
  Lightbulb,
  GraduationCap,
  Building2,
  KeyRound,
  UserRound,
  MessagesSquare,
  BriefcaseBusiness,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import MotivataLogo from "../assets/logo/Motivata.png";
import MotivataLogoSmall from "../assets/logo/logo2.png";
import MembershipRequestBadge from "./MembershipRequestBadge";
import MotivataBlendBadge from "./MotivataBlendBadge";
import RoundTableBadge from "./RoundTableBadge";
import DoerRequestBadge from "./DoerRequestBadge";
import EventRequestBadge from "./EventRequestBadge";

/**
 * Sidebar Component
 * Modern, responsive sidebar with nested menu structure
 */
function Sidebar({ collapsed, isOpen, onClose }) {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState({
    clubs: true,
    services: true,
    engagement: true,
    "registration-requests": true,
    "student-referrals": true,
  });

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
      id: "enrollments",
      label: "Enrollments",
      icon: Ticket,
      path: "/enrollments",
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
      id: "doers-club",
      label: "Doer's Club",
      icon: Briefcase,
      type: "section",
      children: [
        {
          id: "job-posts",
          label: "Job Posts",
          icon: Briefcase,
          path: "/job-posts",
        },
        {
          id: "job-applications",
          label: "Applications",
          icon: Users,
          path: "/job-applications",
        },
        {
          id: "opportunity-filters",
          label: "Opportunity Filters",
          icon: SlidersHorizontal,
          path: "/opportunity-filters",
        },
      ],
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
          label: "Club Post",
          icon: PenSquare,
          path: "/admin-club-posts",
        },
        {
          id: "explore-posts",
          label: "Explore Posts",
          icon: Globe,
          path: "/explore-posts",
        },
        {
          id: "community",
          label: "Weekly Updates & Help",
          icon: MessagesSquare,
          path: "/community",
        },
        {
          id: "occupations",
          label: "Occupations",
          icon: BriefcaseBusiness,
          path: "/occupations",
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
          id: "sos-articles",
          label: "SOS Articles",
          icon: FileText,
          path: "/sos-articles",
        },
        {
          id: "daily-sos",
          label: "Daily SOS",
          icon: CalendarDays,
          path: "/daily-sos",
        },
        {
          id: "qol-factors",
          label: "Life Factors",
          icon: BarChart2,
          path: "/qol-factors",
        },
        {
          id: "challenges",
          label: "Challenges",
          icon: Trophy,
          path: "/challenges",
        },
        {
          id: "daily-challenges",
          label: "Daily Challenges",
          icon: CalendarDays,
          path: "/daily-challenges",
        },
        {
          id: "challenge-rewards",
          label: "Challenge Rewards",
          icon: Gift,
          path: "/challenge-rewards",
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
        {
          id: "recommendations",
          label: "Recommendations",
          icon: Lightbulb,
          path: "/recommendations",
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
        {
          id: "user-subscriptions",
          label: "Subscriptions",
          icon: UserCheck,
          path: "/user-subscriptions",
        },
      ],
    },
    {
      id: "registration-requests",
      label: "Registration Requests",
      icon: ClipboardList,
      type: "section",
      children: [
        {
          id: "motivata-blend-requests",
          label: "Motivata Blend",
          icon: Users,
          path: "/motivata-blend-requests",
          showBadge: "motivataBlend",
        },
        {
          id: "round-table-requests",
          label: "Round Table",
          icon: CircleDot,
          path: "/round-table-requests",
          showBadge: "roundTable",
        },
        {
          id: "event-requests",
          label: "Event Invites",
          icon: Calendar,
          path: "/event-requests",
          showBadge: "eventRequest",
        },
      ],
    },
    {
      id: "student-referrals",
      label: "Student Referrals",
      icon: GraduationCap,
      type: "section",
      children: [
        {
          id: "colleges",
          label: "Colleges",
          icon: Building2,
          path: "/colleges",
        },
        {
          id: "leaders",
          label: "Leaders",
          icon: UserRound,
          path: "/leaders",
        },
        {
          id: "referral-codes",
          label: "Referral Codes",
          icon: KeyRound,
          path: "/referral-codes",
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
      id: "feature-access",
      label: "Feature Access",
      icon: ShieldCheck,
      path: "/feature-access",
      type: "single",
    },
    {
      id: "membership-requests",
      label: "Membership Requests",
      icon: Users,
      path: "/membership-requests",
      type: "single",
      showBadge: true,
    },
    {
      id: "doer-requests",
      label: "Doer Purchases",
      icon: Zap,
      path: "/doer-requests",
      type: "single",
      showBadge: "doer",
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
      id: "coupons",
      label: "Coupons",
      icon: Tag,
      path: "/coupons",
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
      id: "motivata-blend-banner",
      label: "Blend Banner",
      icon: ImagePlay,
      path: "/motivata-blend-banner",
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
            title={collapsed ? item.label : ""}>
            <item.icon
              className={`
                h-4 w-4 shrink-0 transition-transform duration-200
                ${isActive ? "scale-110" : "group-hover:scale-105"}
              `}
            />
            {!collapsed && (
              <>
                <span className="font-medium text-sm truncate flex-1">
                  {item.label}
                </span>
                {item.showBadge === true && <MembershipRequestBadge />}
                {item.showBadge === "doer" && <DoerRequestBadge />}
              </>
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
            title={collapsed ? item.label : ""}>
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
                      `}>
                      <child.icon className="h-4 w-4 shrink-0" />
                      <span className="font-medium text-sm truncate flex-1">
                        {child.label}
                      </span>
                      {child.showBadge === "motivataBlend" && (
                        <MotivataBlendBadge />
                      )}
                      {child.showBadge === "roundTable" && <RoundTableBadge />}
                      {child.showBadge === "eventRequest" && <EventRequestBadge />}
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
      `}>
      {/* Header with Logo and Close Button */}
      <div className="p-5 lg:p-6 border-b border-gray-200/80 shrink-0 bg-white/80 backdrop-blur-sm">
        <div className="flex items-start justify-between">
          <div
            className={`flex flex-col ${
              collapsed ? "items-center" : "items-start"
            } min-w-0 flex-1`}>
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
            aria-label="Close sidebar">
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
    </aside>
  );
}

export default Sidebar;
