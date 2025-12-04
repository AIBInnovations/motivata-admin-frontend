import { useState, useEffect } from 'react';
import { Search, Edit, Trash2, Eye, RotateCcw, AlertTriangle, Loader2 } from 'lucide-react';
import useUsers from '../hooks/useUsers';
import { useAuth } from '../contexts/AuthContext';
import Pagination from '../components/ui/Pagination';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import UserForm from '../components/users/UserForm';
import UserDetailsModal from '../components/users/UserDetailsModal';

function Users() {
  const { hasRole } = useAuth();
  const {
    users,
    pagination,
    filters,
    isLoading,
    error,
    getUserById,
    updateUser,
    deleteUser,
    restoreUser,
    permanentDeleteUser,
    updateFilters,
    changePage,
    clearError,
  } = useUsers();

  // Check if user has edit/delete permissions (not MANAGEMENT_STAFF)
  const canModify = hasRole(['SUPER_ADMIN', 'ADMIN']);

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [isPermanentDeleteDialogOpen, setIsPermanentDeleteDialogOpen] = useState(false);

  // Selected user for operations
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailsUser, setDetailsUser] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Form states
  const [formError, setFormError] = useState(null);
  const [formValidationErrors, setFormValidationErrors] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search debounce
  const [searchInput, setSearchInput] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        updateFilters({ search: searchInput });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, filters.search, updateFilters]);

  // Handle view user details
  const handleViewDetails = async (user) => {
    setIsDetailsModalOpen(true);
    setIsLoadingDetails(true);
    setDetailsUser(null);

    const result = await getUserById(user._id);
    if (result.success) {
      setDetailsUser(result.data);
    } else {
      setDetailsUser(user); // Fallback to basic data
    }
    setIsLoadingDetails(false);
  };

  // Handle edit user
  const handleEditClick = (user) => {
    if (!canModify) return;
    setSelectedUser(user);
    setFormError(null);
    setFormValidationErrors(null);
    setIsEditModalOpen(true);
  };

  // Handle edit form submit
  const handleEditSubmit = async (formData) => {
    setIsSubmitting(true);
    setFormError(null);
    setFormValidationErrors(null);

    const result = await updateUser(selectedUser._id, formData);

    if (result.success) {
      setIsEditModalOpen(false);
      setSelectedUser(null);
    } else {
      setFormError(result.error);
      setFormValidationErrors(result.validationErrors);
    }

    setIsSubmitting(false);
  };

  // Handle delete click
  const handleDeleteClick = (user) => {
    if (!canModify) return;
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    const result = await deleteUser(selectedUser._id);
    setIsDeleteDialogOpen(false);
    setSelectedUser(null);

    if (!result.success) {
      // Show error toast or notification
      console.error('Delete failed:', result.error);
    }
  };

  // Handle restore click
  const handleRestoreClick = (user) => {
    if (!canModify) return;
    setSelectedUser(user);
    setIsRestoreDialogOpen(true);
  };

  // Handle restore confirm
  const handleRestoreConfirm = async () => {
    const result = await restoreUser(selectedUser._id);
    setIsRestoreDialogOpen(false);
    setSelectedUser(null);

    if (!result.success) {
      console.error('Restore failed:', result.error);
    }
  };

  // Handle permanent delete click
  const handlePermanentDeleteClick = (user) => {
    if (!canModify) return;
    setSelectedUser(user);
    setIsPermanentDeleteDialogOpen(true);
  };

  // Handle permanent delete confirm
  const handlePermanentDeleteConfirm = async () => {
    const result = await permanentDeleteUser(selectedUser._id);
    setIsPermanentDeleteDialogOpen(false);
    setSelectedUser(null);

    if (!result.success) {
      console.error('Permanent delete failed:', result.error);
    }
  };

  // Handle include deleted toggle
  const handleIncludeDeletedToggle = () => {
    updateFilters({ includeDeleted: !filters.includeDeleted });
  };

  // Close modals
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedUser(null);
    setFormError(null);
    setFormValidationErrors(null);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setDetailsUser(null);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Users Management</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Manage and monitor user accounts
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            />
          </div>

          {/* Include Deleted Toggle */}
          {canModify && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.includeDeleted}
                onChange={handleIncludeDeletedToggle}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">Show deleted users</span>
            </label>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            <span>{error}</span>
          </div>
          <button onClick={clearError} className="text-red-700 hover:text-red-900">
            Dismiss
          </button>
        </div>
      )}

      {/* Users List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        {isLoading && users.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            <p className="mt-2 text-sm text-gray-500">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <p>No users found</p>
            {filters.search && (
              <p className="text-sm mt-1">Try adjusting your search criteria</p>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">User</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Phone</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Last Login</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user._id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        user.isDeleted ? 'bg-red-50/50' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-semibold text-sm">
                              {user.name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{user.name}</p>
                            <p className="text-sm text-gray-500 truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{user.phone || '-'}</td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        {user.lastLogin
                          ? new Date(user.lastLogin).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Never'}
                      </td>
                      <td className="px-6 py-4">
                        {user.isDeleted ? (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            Deleted
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewDetails(user)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="View Details"
                          >
                            <Eye className="h-5 w-5" />
                          </button>

                          {canModify && (
                            <>
                              {user.isDeleted ? (
                                <>
                                  <button
                                    onClick={() => handleRestoreClick(user)}
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                    title="Restore User"
                                  >
                                    <RotateCcw className="h-5 w-5" />
                                  </button>
                                  <button
                                    onClick={() => handlePermanentDeleteClick(user)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                    title="Permanently Delete"
                                  >
                                    <Trash2 className="h-5 w-5" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleEditClick(user)}
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                    title="Edit"
                                  >
                                    <Edit className="h-5 w-5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClick(user)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-5 w-5" />
                                  </button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden divide-y divide-gray-200">
              {users.map((user) => (
                <div
                  key={user._id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    user.isDeleted ? 'bg-red-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold">
                        {user.name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{user.name}</p>
                      <p className="text-sm text-gray-500 truncate">{user.email}</p>
                      <p className="text-sm text-gray-500 mt-1">{user.phone || 'No phone'}</p>
                    </div>
                    <div>
                      {user.isDeleted ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          Deleted
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Active
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      Last login:{' '}
                      {user.lastLogin
                        ? new Date(user.lastLogin).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })
                        : 'Never'}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleViewDetails(user)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="View Details"
                      >
                        <Eye className="h-5 w-5" />
                      </button>

                      {canModify && (
                        <>
                          {user.isDeleted ? (
                            <>
                              <button
                                onClick={() => handleRestoreClick(user)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                title="Restore"
                              >
                                <RotateCcw className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handlePermanentDeleteClick(user)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete Forever"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditClick(user)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                title="Edit"
                              >
                                <Edit className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(user)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
              onPageChange={changePage}
              itemLabel="users"
            />
          </>
        )}
      </div>

      {/* Edit Modal */}
      <UserForm
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSubmit={handleEditSubmit}
        user={selectedUser}
        isLoading={isSubmitting}
        serverError={formError}
        validationErrors={formValidationErrors}
      />

      {/* Details Modal */}
      <UserDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        user={detailsUser}
        isLoading={isLoadingDetails}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete User"
        message={`Are you sure you want to delete "${selectedUser?.name}"? This action can be undone by restoring the user.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isLoading}
      />

      {/* Restore Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isRestoreDialogOpen}
        onClose={() => setIsRestoreDialogOpen(false)}
        onConfirm={handleRestoreConfirm}
        title="Restore User"
        message={`Are you sure you want to restore "${selectedUser?.name}"?`}
        confirmText="Restore"
        variant="primary"
        isLoading={isLoading}
      />

      {/* Permanent Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isPermanentDeleteDialogOpen}
        onClose={() => setIsPermanentDeleteDialogOpen(false)}
        onConfirm={handlePermanentDeleteConfirm}
        title="Permanently Delete User"
        message={`Are you sure you want to PERMANENTLY delete "${selectedUser?.name}"? This action CANNOT be undone and all user data will be lost forever.`}
        confirmText="Delete Forever"
        variant="danger"
        isLoading={isLoading}
      />
    </div>
  );
}

export default Users;
