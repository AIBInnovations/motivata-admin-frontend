import { Bell, Search, Menu } from 'lucide-react'
import adminImg from '../assets/images/header/adminimg.jpg'

function Header({ toggleSidebar }) {
  return (
    <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
      <button onClick={toggleSidebar} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-all">
        <Menu className="h-6 w-6" />
      </button>

      <div className="flex items-center gap-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-9 pr-4 py-2 w-64 bg-gray-100 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
        </div>

        {/* Notification Icon */}
        <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-all">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 cursor-pointer">
          <img
            src={adminImg}
            alt="User"
            className="w-10 h-10 rounded-full object-cover"
          />
        </div>
      </div>
    </header>
  )
}

export default Header
