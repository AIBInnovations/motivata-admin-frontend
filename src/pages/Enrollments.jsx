import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  RefreshCw,
  XCircle,
  Loader2,
  User,
  Phone,
  Mail,
  Calendar,
  Ticket,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'react-toastify';
import enrollmentService from '../services/enrollment.service';
import eventService from '../services/event.service';
import Pagination from '../components/ui/Pagination';

const STATUS_CONFIG = {
  ACTIVE: { label: 'Active', bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  REFUNDED: { label: 'Refunded', bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
  MIXED: { label: 'Partially Cancelled', bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
};

/**
 * Collapse a ticket Map (phone -> { status }) into one display status.
 * All same -> that status; a mix of active and cancelled -> MIXED.
 */
const deriveStatus = (tickets) => {
  const values = tickets ? Object.values(tickets) : [];
  if (!values.length) return 'ACTIVE';
  const statuses = [...new Set(values.map((t) => t.status))];
  if (statuses.length === 1) return statuses[0];
  if (statuses.includes('ACTIVE')) return 'MIXED';
  return statuses[0];
};

const formatDate = (value) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

function Enrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 0, totalCount: 0, limit: 10 });
  const [filters, setFilters] = useState({ page: 1, limit: 10, status: '', eventId: '', sortBy: 'createdAt', sortOrder: 'desc' });
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEnrollments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await enrollmentService.getAll(filters);
      if (result.success) {
        setEnrollments(result.data.enrollments || []);
        setPagination((prev) => result.data.pagination || prev);
      } else {
        setError(result.message || 'Failed to fetch enrollments');
        setEnrollments([]);
      }
    } catch {
      setError('An error occurred while fetching enrollments');
      setEnrollments([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  // Event dropdown for the filter. Loaded once.
  useEffect(() => {
    eventService
      .getDropdownEvents()
      .then((result) => {
        if (result.success) setEvents(result.data.events || []);
      })
      .catch(() => {});
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleCancel = async (enrollment) => {
    const name = enrollment.userId?.name || 'this user';
    if (!window.confirm(`Cancel ALL tickets for ${name}? This cannot be undone.`)) return;
    try {
      const result = await enrollmentService.cancel(enrollment._id, { cancelAll: true, reason: 'Cancelled by admin' });
      if (result.success) {
        toast.success('Enrollment cancelled');
        fetchEnrollments();
      } else {
        toast.error(result.message || 'Failed to cancel enrollment');
      }
    } catch {
      toast.error('An error occurred while cancelling');
    }
  };

  const getStatusBadge = (status) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.ACTIVE;
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}>
        {config.label}
      </span>
    );
  };

  // Backend has no text search on enrollments, so filter the loaded page here.
  const term = search.trim().toLowerCase();
  const visible = term
    ? enrollments.filter((e) => {
        const u = e.userId || {};
        return [u.name, u.email, u.phone].some((v) => v && String(v).toLowerCase().includes(term));
      })
    : enrollments;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enrollments</h1>
          <p className="text-sm text-gray-500 mt-1">Event enrollments and their ticket status</p>
        </div>
        <button
          onClick={fetchEnrollments}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
        <div className="flex items-center gap-2 text-gray-700 font-semibold">
          <Filter className="h-5 w-5" />
          Filters
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search this page by name, phone, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
            />
          </div>

          <select
            value={filters.eventId}
            onChange={(e) => handleFilterChange('eventId', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
          >
            <option value="">All Events</option>
            {events.map((ev) => (
              <option key={ev._id} value={ev._id}>
                {ev.name}
              </option>
            ))}
          </select>

          <select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              setFilters((prev) => ({ ...prev, sortBy, sortOrder, page: 1 }));
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {isLoading && (
        <div className="bg-white rounded-xl shadow-sm p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-800" />
          <span className="ml-3 text-gray-600">Loading enrollments...</span>
        </div>
      )}

      {!isLoading && visible.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <Ticket className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900">No enrollments found</p>
          <p className="text-sm text-gray-500 mt-1">
            {search || filters.eventId ? 'Try adjusting your filters' : 'Enrollments will appear here'}
          </p>
        </div>
      )}

      {!isLoading && visible.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Attendee</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Event</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Tickets</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Enrolled On</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((enrollment) => {
                  const user = enrollment.userId || {};
                  const event = enrollment.eventId || {};
                  const status = deriveStatus(enrollment.tickets);
                  const amount =
                    enrollment.paymentId?.finalAmount ??
                    enrollment.paymentId?.amount ??
                    (enrollment.ticketPrice != null ? enrollment.ticketPrice * (enrollment.ticketCount || 1) : null);

                  return (
                    <tr key={enrollment._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{user.name || 'Unknown'}</span>
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3.5 w-3.5 text-gray-400" />
                              <span className="text-sm text-gray-600">{user.phone}</span>
                            </div>
                          )}
                          {user.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-3.5 w-3.5 text-gray-400" />
                              <span className="text-sm text-gray-600">{user.email}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{event.name || 'Unknown event'}</p>
                        {event.startDate && <p className="text-xs text-gray-500">{formatDate(event.startDate)}</p>}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Ticket className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{enrollment.ticketCount || 1}</span>
                        </div>
                        {amount != null && (
                          <p className="text-xs text-gray-500 mt-1">₹{Number(amount).toLocaleString('en-IN')}</p>
                        )}
                        {enrollment.tierName && <p className="text-xs text-gray-400">{enrollment.tierName}</p>}
                      </td>

                      <td className="px-6 py-4">{getStatusBadge(status)}</td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          {formatDate(enrollment.createdAt)}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {status !== 'CANCELLED' && status !== 'REFUNDED' && (
                            <button
                              onClick={() => handleCancel(enrollment)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Cancel enrollment"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="border-t border-gray-200 px-6 py-4">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
              totalItems={pagination.totalCount}
              itemsPerPage={pagination.limit}
              itemLabel="enrollments"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Enrollments;
