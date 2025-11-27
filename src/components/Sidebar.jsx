import { LayoutDashboard, Calendar, Users, LogOut, Ticket, UserCog, CreditCard, ShieldCheck, Banknote } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function Sidebar({ activeMenu, setActiveMenu, collapsed }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    navigate('/login')
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'enrollments', label: 'Enrollments', icon: Users },
    { id: 'coupons', label: 'Coupons', icon: Ticket },
    { id: 'users', label: 'Users Management', icon: UserCog },
    { id: 'admins', label: 'Admin Management', icon: ShieldCheck },
    { id: 'payments', label: 'Payment History', icon: CreditCard },
    { id: 'cashtickets', label: 'Cash Tickets', icon: Banknote },
  ]

  return (
    <aside className={`${collapsed ? 'w-20' : 'w-64'} bg-white shadow-lg flex flex-col transition-all duration-300`}>
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-8 w-8 text-blue-600 flex-shrink-0" />
          {!collapsed && <h1 className="text-xl font-bold text-gray-900">Admin</h1>}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveMenu(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeMenu === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
