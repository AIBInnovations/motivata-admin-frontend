import { useState } from 'react'
import { LayoutDashboard, Calendar, Users, LogOut, ChevronLeft, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function Sidebar({ activeMenu, setActiveMenu }) {
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = () => {
    navigate('/login')
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'enrollments', label: 'Enrollments', icon: Users },
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

      {/* Collapse Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="p-4 border-t border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700"
      >
        {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
      </button>

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
