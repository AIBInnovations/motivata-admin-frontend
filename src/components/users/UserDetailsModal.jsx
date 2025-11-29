import { Loader2, Mail, Phone, Clock, Calendar, Award, AlertCircle } from 'lucide-react';
import Modal from '../ui/Modal';

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format date short (without time)
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
const formatDateShort = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * UserDetailsModal Component
 * Modal for displaying user details including enrollments
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal visibility
 * @param {Function} props.onClose - Close modal callback
 * @param {Object} props.user - User data
 * @param {boolean} props.isLoading - Loading state
 */
function UserDetailsModal({ isOpen, onClose, user, isLoading = false }) {
  if (!user && !isLoading) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="User Details" size="lg">
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          <p className="mt-2 text-sm text-gray-500">Loading user details...</p>
        </div>
      ) : user ? (
        <div className="space-y-6">
          {/* User Header */}
          <div className="flex items-start gap-4 pb-4 border-b border-gray-200">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
              <span className="text-xl font-semibold text-blue-600">
                {user.name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">{user.name}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {user.isDeleted && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Deleted
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Contact Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Email */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-xs text-gray-500 font-medium">Email</span>
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">{user.email || '-'}</p>
              </div>

              {/* Phone */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-xs text-gray-500 font-medium">Phone</span>
                </div>
                <p className="text-sm font-medium text-gray-900">{user.phone || '-'}</p>
              </div>
            </div>
          </div>

          {/* Activity Details */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Activity</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Last Login */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-xs text-gray-500 font-medium">Last Login</span>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                </p>
              </div>

              {/* Created At */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-xs text-gray-500 font-medium">Joined</span>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(user.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Enrollments */}
          {user.enrollments && user.enrollments.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700">
                  Enrollments ({user.enrollments.length})
                </h4>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {user.enrollments.map((enrollment, index) => (
                  <div
                    key={enrollment._id || index}
                    className="bg-gray-50 rounded-lg p-3 flex items-center gap-3"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                      <Award className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {enrollment.event?.name || enrollment.event || 'Unknown Event'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Enrolled: {formatDateShort(enrollment.enrolledAt)}
                      </p>
                    </div>
                    {enrollment.certificate && (
                      <a
                        href={enrollment.certificate}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-700 hover:underline shrink-0"
                      >
                        View Certificate
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <Award className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No enrollments yet</p>
            </div>
          )}

          {/* Deleted Info */}
          {user.isDeleted && user.deletedAt && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p className="text-sm">
                  This user was deleted on {formatDate(user.deletedAt)}
                </p>
              </div>
            </div>
          )}

          {/* Close Button */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-gray-500">
          <p>No user data available</p>
        </div>
      )}
    </Modal>
  );
}

export default UserDetailsModal;
