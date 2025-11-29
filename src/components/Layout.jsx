import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const location = useLocation()

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed)

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
  }

  const getActiveMenu = () => {
    return routeToMenuId[location.pathname] || 'dashboard'
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar
        activeMenu={getActiveMenu()}
        collapsed={sidebarCollapsed}
      />

      <div className="flex-1 flex flex-col">
        <Header toggleSidebar={toggleSidebar} />

        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
