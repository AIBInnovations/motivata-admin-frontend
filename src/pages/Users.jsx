import { useState } from 'react'
import { Search, ChevronLeft, ChevronRight, Edit, Trash2 } from 'lucide-react'

function Users() {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const usersPerPage = 10

  const statusColors = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-gray-100 text-gray-700',
    suspended: 'bg-red-100 text-red-700',
  }

  const [users, setUsers] = useState([
    { id: 1, name: 'John Doe', email: 'john.doe@email.com', phone: '+91 9876543210', role: 'admin', status: 'active', joinedDate: '2024-01-15' },
    { id: 2, name: 'Jane Smith', email: 'jane.smith@email.com', phone: '+91 9876543211', role: 'user', status: 'active', joinedDate: '2024-02-20' },
    { id: 3, name: 'Mike Johnson', email: 'mike.j@email.com', phone: '+91 9876543212', role: 'moderator', status: 'active', joinedDate: '2024-03-10' },
    { id: 4, name: 'Sarah Wilson', email: 'sarah.w@email.com', phone: '+91 9876543213', role: 'user', status: 'inactive', joinedDate: '2024-03-25' },
    { id: 5, name: 'David Brown', email: 'david.b@email.com', phone: '+91 9876543214', role: 'user', status: 'active', joinedDate: '2024-04-05' },
    { id: 6, name: 'Emily Davis', email: 'emily.d@email.com', phone: '+91 9876543215', role: 'user', status: 'suspended', joinedDate: '2024-04-18' },
    { id: 7, name: 'Chris Martin', email: 'chris.m@email.com', phone: '+91 9876543216', role: 'moderator', status: 'active', joinedDate: '2024-05-02' },
    { id: 8, name: 'Lisa Anderson', email: 'lisa.a@email.com', phone: '+91 9876543217', role: 'user', status: 'active', joinedDate: '2024-05-15' },
    { id: 9, name: 'Robert Taylor', email: 'robert.t@email.com', phone: '+91 9876543218', role: 'user', status: 'inactive', joinedDate: '2024-06-01' },
    { id: 10, name: 'Amanda White', email: 'amanda.w@email.com', phone: '+91 9876543219', role: 'user', status: 'active', joinedDate: '2024-06-20' },
    { id: 11, name: 'Kevin Lee', email: 'kevin.l@email.com', phone: '+91 9876543220', role: 'user', status: 'active', joinedDate: '2024-07-08' },
    { id: 12, name: 'Michelle Garcia', email: 'michelle.g@email.com', phone: '+91 9876543221', role: 'admin', status: 'active', joinedDate: '2024-07-25' },
  ])

  const statuses = ['active', 'inactive', 'suspended']

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter((user) => user.id !== id))
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter ? user.status === statusFilter : true
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage)
  const startIndex = (currentPage - 1) * usersPerPage
  const endIndex = startIndex + usersPerPage
  const currentUsers = filteredUsers.slice(startIndex, endIndex)

  const handleFilterChange = (setter, value) => {
    setter(value)
    setCurrentPage(1)
  }

  const goToPrevious = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1)
  }

  const goToNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1)
  }

  return (
    <div>
      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
          >
            <option value="">All Status</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">User</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Phone</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Status</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map((user) => (
              <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium">{user.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{user.phone}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[user.status]}`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all" title="Edit">
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Delete"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Showing {filteredUsers.length > 0 ? startIndex + 1 : 0} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevious}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg transition-all ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg transition-all ${currentPage === page ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={goToNext}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg transition-all ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Users
