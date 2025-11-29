import {
  LayoutDashboard,
  Calendar,
  Users,
  LogOut,
  Ticket,
  UserCog,
  CreditCard,
  ShieldCheck,
  Banknote,
  Gift,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function Sidebar({ activeMenu, collapsed }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menuItems = [
    // { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    // { id: 'events', label: 'Events', icon: Calendar, path: '/events' },
    // { id: 'enrollments', label: 'Enrollments', icon: Users, path: '/enrollments' },
    // { id: 'coupons', label: 'Coupons', icon: Ticket, path: '/coupons' },
    { id: "users", label: "Users Management", icon: UserCog, path: "/users" },
    {
      id: "admins",
      label: "Admin Management",
      icon: ShieldCheck,
      path: "/admins",
    },
    // { id: 'payments', label: 'Payment History', icon: CreditCard, path: '/payments' },
    {
      id: "cashtickets",
      label: "Cash Tickets",
      icon: Banknote,
      path: "/cash-tickets",
    },
    { id: "vouchers", label: "Vouchers", icon: Gift, path: "/vouchers" },
  ];

  return (
    <aside
      className={`${
        collapsed ? "w-20" : "w-64"
      } bg-white shadow-lg flex flex-col transition-all duration-300`}
    >
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-8 w-8 text-blue-600 flex-shrink-0" />
          {!collapsed && (
            <h1 className="text-xl font-bold text-gray-900">Admin</h1>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <Link
                to={item.path}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeMenu === item.id
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
