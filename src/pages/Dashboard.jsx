import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import Events from './Events'
import Enrollments from './Enrollments'

function Dashboard() {
  const [activeMenu, setActiveMenu] = useState('dashboard')

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header />

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-auto">
          {activeMenu === 'dashboard' && <DashboardContent />}
          {activeMenu === 'events' && <Events />}
          {activeMenu === 'enrollments' && <Enrollments />}
        </main>
      </div>
    </div>
  )
}

function DashboardContent() {
  const stats = [
    { title: 'Total Events', value: '24', color: 'bg-blue-500' },
    { title: 'Total Enrollments', value: '1,234', color: 'bg-green-500' },
    { title: 'Active Users', value: '856', color: 'bg-purple-500' },
    { title: 'This Month', value: '+12.5%', color: 'bg-orange-500' },
  ]

  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Welcome back, Admin!</h2>
        <p className="text-gray-600 mt-1">Here's what's happening with your business today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-sm text-gray-600">{stat.title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
            <div className={`${stat.color} h-1 w-full rounded mt-4`}></div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900">New enrollment #{1000 + item}</p>
                  <p className="text-sm text-gray-500">2 minutes ago</p>
                </div>
              </div>
              <span className="text-green-600 font-medium">Confirmed</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default Dashboard
