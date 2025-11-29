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
    <div>
      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search Input */}
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
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
            <div className="overflow-x-auto">
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
                      className={`border-b border-gray-100 hover:bg-gray-50 ${
                        user.isDeleted ? 'bg-red-50/50' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {user.name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{user.phone || '-'}</td>
                      <td className="px-6 py-4 text-gray-600">
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
                          {/* View Details */}
                          <button
                            onClick={() => handleViewDetails(user)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="View Details"
                          >
                            <Eye className="h-5 w-5" />
                          </button>

                          {/* Actions based on user status and permissions */}
                          {canModify && (
                            <>
                              {user.isDeleted ? (
                                <>
                                  {/* Restore */}
                                  <button
                                    onClick={() => handleRestoreClick(user)}
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                    title="Restore User"
                                  >
                                    <RotateCcw className="h-5 w-5" />
                                  </button>
                                  {/* Permanent Delete */}
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
                                  {/* Edit */}
                                  <button
                                    onClick={() => handleEditClick(user)}
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                    title="Edit"
                                  >
                                    <Edit className="h-5 w-5" />
                                  </button>
                                  {/* Delete */}
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
