import { useState } from 'react'
import { Search, ChevronLeft, ChevronRight, Eye, Trash2 } from 'lucide-react'

function Enrollments() {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [eventFilter, setEventFilter] = useState('')
  const enrollmentsPerPage = 10

  const statusColors = {
    confirmed: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    cancelled: 'bg-red-100 text-red-700',
  }

  const [enrollments, setEnrollments] = useState([
    {
      id: 1,
      userName: 'John Doe',
      email: 'john.doe@email.com',
      phone: '+91 9876543210',
      eventName: 'Tech Conference 2025',
      enrollmentDate: '2025-02-15',
      status: 'confirmed',
    },
    {
      id: 2,
      userName: 'Jane Smith',
      email: 'jane.smith@email.com',
      phone: '+91 9876543211',
      eventName: 'Medical Summit 2025',
      enrollmentDate: '2025-02-18',
      status: 'pending',
    },
    {
      id: 3,
      userName: 'Mike Johnson',
      email: 'mike.j@email.com',
      phone: '+91 9876543212',
      eventName: 'Comedy Night Live',
      enrollmentDate: '2025-02-20',
      status: 'confirmed',
    },
    {
      id: 4,
      userName: 'Sarah Wilson',
      email: 'sarah.w@email.com',
      phone: '+91 9876543213',
      eventName: 'Rock Music Festival',
      enrollmentDate: '2025-02-22',
      status: 'cancelled',
    },
    {
      id: 5,
      userName: 'David Brown',
      email: 'david.b@email.com',
      phone: '+91 9876543214',
      eventName: 'AI Workshop 2025',
      enrollmentDate: '2025-02-25',
      status: 'confirmed',
    },
    {
      id: 6,
      userName: 'Emily Davis',
      email: 'emily.d@email.com',
      phone: '+91 9876543215',
      eventName: 'Health Awareness Camp',
      enrollmentDate: '2025-02-28',
      status: 'pending',
    },
    {
      id: 7,
      userName: 'Chris Martin',
      email: 'chris.m@email.com',
      phone: '+91 9876543216',
      eventName: 'Stand-up Comedy Show',
      enrollmentDate: '2025-03-01',
      status: 'confirmed',
    },
    {
      id: 8,
      userName: 'Lisa Anderson',
      email: 'lisa.a@email.com',
      phone: '+91 9876543217',
      eventName: 'Jazz Night',
      enrollmentDate: '2025-03-05',
      status: 'confirmed',
    },
    {
      id: 9,
      userName: 'Robert Taylor',
      email: 'robert.t@email.com',
      phone: '+91 9876543218',
      eventName: 'Tech Conference 2025',
      enrollmentDate: '2025-03-08',
      status: 'pending',
    },
    {
      id: 10,
      userName: 'Amanda White',
      email: 'amanda.w@email.com',
      phone: '+91 9876543219',
      eventName: 'Medical Summit 2025',
      enrollmentDate: '2025-03-10',
      status: 'confirmed',
    },
    {
      id: 11,
      userName: 'Kevin Lee',
      email: 'kevin.l@email.com',
      phone: '+91 9876543220',
      eventName: 'Rock Music Festival',
      enrollmentDate: '2025-03-12',
      status: 'cancelled',
    },
    {
      id: 12,
      userName: 'Michelle Garcia',
      email: 'michelle.g@email.com',
      phone: '+91 9876543221',
      eventName: 'Comedy Night Live',
      enrollmentDate: '2025-03-15',
      status: 'confirmed',
    },
  ])

  const events = [...new Set(enrollments.map((e) => e.eventName))]
  const statuses = ['confirmed', 'pending', 'cancelled']

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this enrollment?')) {
      setEnrollments(enrollments.filter((enrollment) => enrollment.id !== id))
    }
  }

  // Filter enrollments
  const filteredEnrollments = enrollments
    .filter((enrollment) => {
      const matchesSearch =
        enrollment.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        enrollment.email.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter ? enrollment.status === statusFilter : true
      const matchesEvent = eventFilter ? enrollment.eventName === eventFilter : true
      return matchesSearch && matchesStatus && matchesEvent
    })

  // Pagination logic
  const totalPages = Math.ceil(filteredEnrollments.length / enrollmentsPerPage)
  const startIndex = (currentPage - 1) * enrollmentsPerPage
  const endIndex = startIndex + enrollmentsPerPage
  const currentEnrollments = filteredEnrollments.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
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
          {/* Search Bar */}
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none bg-white"
          >
            <option value="">All Status</option>
            {statuses.map((status) => (
              <option key={status} value={status} className="capitalize">
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>

          {/* Event Filter */}
          <select
            value={eventFilter}
            onChange={(e) => handleFilterChange(setEventFilter, e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none bg-white"
          >
            <option value="">All Events</option>
            {events.map((event) => (
              <option key={event} value={event}>
                {event}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Enrollments List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">User</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Event</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Phone</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Enrollment Date</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Status</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentEnrollments.map((enrollment) => (
              <tr key={enrollment.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900">{enrollment.userName}</p>
                    <p className="text-sm text-gray-500">{enrollment.email}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{enrollment.eventName}</td>
                <td className="px-6 py-4 text-gray-600">{enrollment.phone}</td>
                <td className="px-6 py-4 text-gray-600">{enrollment.enrollmentDate}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                      statusColors[enrollment.status]
                    }`}
                  >
                    {enrollment.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      className="p-2 text-gray-800 hover:bg-gray-50 rounded-lg transition-all"
                      title="View Details"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(enrollment.id)}
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
            Showing {filteredEnrollments.length > 0 ? startIndex + 1 : 0} to{' '}
            {Math.min(endIndex, filteredEnrollments.length)} of {filteredEnrollments.length} enrollments
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevious}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg transition-all ${
                currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg transition-all ${
                  currentPage === page ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={goToNext}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg transition-all ${
                currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Enrollments
