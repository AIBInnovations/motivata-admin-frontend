import { useEffect, useState } from 'react';
import {
  Users,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  XCircle,
  Edit3,
  Trash2,
  BarChart3,
  MessageSquare,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import clubsService from '../services/clubs.service';
import Modal from '../components/ui/Modal';
import FileUpload from '../components/ui/FileUpload';
import Pagination from '../components/ui/Pagination';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const defaultClubForm = {
  name: '',
  description: '',
  thumbnail: '',
};

const defaultPagination = {
  currentPage: 1,
  totalPages: 0,
  totalCount: 0,
  limit: 10,
};

function Clubs() {
  const { hasRole } = useAuth();
  const canManage = hasRole(['SUPER_ADMIN', 'ADMIN']);

  const [activeTab, setActiveTab] = useState('clubs');

  // Clubs state
  const [clubs, setClubs] = useState([]);
  const [clubForm, setClubForm] = useState(defaultClubForm);
  const [clubFilters, setClubFilters] = useState({ search: '' });
  const [clubPagination, setClubPagination] = useState({ ...defaultPagination, limit: 12 });
  const [isLoadingClubs, setIsLoadingClubs] = useState(false);
  const [isSubmittingClub, setIsSubmittingClub] = useState(false);
  const [clubError, setClubError] = useState(null);
  const [editingClub, setEditingClub] = useState(null);
  const [showClubModal, setShowClubModal] = useState(false);
  const [deleteClubId, setDeleteClubId] = useState(null);
  const [selectedClubStats, setSelectedClubStats] = useState(null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Selected club for members
  const [selectedClub, setSelectedClub] = useState(null);

  // Members state
  const [members, setMembers] = useState([]);
  const [memberPagination, setMemberPagination] = useState(defaultPagination);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [memberError, setMemberError] = useState(null);

  // Fetch clubs with accurate stats
  const fetchClubs = async (page = 1) => {
    setIsLoadingClubs(true);
    setClubError(null);

    const params = {
      page,
      limit: clubPagination.limit,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };

    if (clubFilters.search.trim()) params.search = clubFilters.search.trim();

    const result = await clubsService.getClubs(params);
    if (result.success) {
      const clubsList = result.data?.clubs || [];

      // Fetch accurate stats for each club in parallel
      const clubsWithStats = await Promise.all(
        clubsList.map(async (club) => {
          try {
            const statsResult = await clubsService.getClubStats(club._id);
            console.log('[Clubs] Stats result for', club.name, ':', statsResult);

            if (statsResult.success && statsResult.data) {
              // Stats might be in statsResult.data.stats or directly in statsResult.data
              const stats = statsResult.data.stats || statsResult.data;
              console.log('[Clubs] Extracted stats:', stats);

              return {
                ...club,
                memberCount: stats.totalMembers ?? club.memberCount,
                postCount: stats.totalPosts ?? club.postCount,
              };
            }
          } catch (err) {
            console.error('[Clubs] Stats fetch error for', club.name, ':', err);
          }
          return club;
        })
      );

      setClubs(clubsWithStats);
      setClubPagination({
        currentPage: result.data?.pagination?.currentPage || page,
        totalPages: result.data?.pagination?.totalPages || 0,
        totalCount: result.data?.pagination?.totalCount || 0,
        limit: result.data?.pagination?.limit || clubPagination.limit,
      });
    } else {
      setClubError(result.message || 'Failed to load clubs');
    }

    setIsLoadingClubs(false);
  };

  // Fetch members for selected club
  const fetchMembers = async (page = 1) => {
    if (!selectedClub) return;

    setIsLoadingMembers(true);
    setMemberError(null);

    const params = {
      page,
      limit: memberPagination.limit,
    };

    const result = await clubsService.getClubMembers(selectedClub._id, params);
    if (result.success) {
      setMembers(result.data?.members || []);
      setMemberPagination({
        currentPage: result.data?.pagination?.currentPage || page,
        totalPages: result.data?.pagination?.totalPages || 0,
        totalCount: result.data?.pagination?.totalCount || 0,
        limit: result.data?.pagination?.limit || memberPagination.limit,
      });
    } else {
      setMemberError(result.message || 'Failed to load members');
    }

    setIsLoadingMembers(false);
  };

  useEffect(() => {
    fetchClubs(1);
  }, []);

  useEffect(() => {
    if (activeTab === 'members' && selectedClub) {
      fetchMembers(1);
    }
  }, [activeTab, selectedClub]);

  const resetClubForm = () => setClubForm(defaultClubForm);

  const handleCreateClub = async (e) => {
    e.preventDefault();
    if (!canManage) return;
    setIsSubmittingClub(true);
    setClubError(null);

    const payload = {
      name: clubForm.name.trim(),
      description: clubForm.description.trim(),
      thumbnail: clubForm.thumbnail.trim() || undefined,
    };

    const result = await clubsService.createClub(payload);
    if (result.success) {
      resetClubForm();
      fetchClubs(1);
    } else {
      setClubError(result.message || 'Failed to create club');
    }
    setIsSubmittingClub(false);
  };

  const openEditClub = (club) => {
    setEditingClub(club);
    setClubForm({
      name: club.name || '',
      description: club.description || '',
      thumbnail: club.thumbnail || '',
    });
    setShowClubModal(true);
  };

  const handleUpdateClub = async (e) => {
    e.preventDefault();
    if (!editingClub) return;
    setIsSubmittingClub(true);
    setClubError(null);

    const payload = {
      name: clubForm.name.trim(),
      description: clubForm.description.trim(),
      thumbnail: clubForm.thumbnail.trim() || undefined,
    };

    const result = await clubsService.updateClub(editingClub._id, payload);
    if (result.success) {
      setShowClubModal(false);
      setEditingClub(null);
      resetClubForm();
      fetchClubs(clubPagination.currentPage);
    } else {
      setClubError(result.message || 'Failed to update club');
    }
    setIsSubmittingClub(false);
  };

  const handleDeleteClub = async () => {
    if (!deleteClubId) return;
    setActionLoading(true);
    await clubsService.deleteClub(deleteClubId);
    setActionLoading(false);
    setDeleteClubId(null);
    fetchClubs(clubPagination.currentPage);
  };

  const handleViewStats = async (club) => {
    setActionLoading(true);
    const result = await clubsService.getClubStats(club._id);
    if (result.success) {
      setSelectedClubStats(result.data?.stats || null);
      setShowStatsModal(true);
    }
    setActionLoading(false);
  };

  const handleSelectClub = (club) => {
    setSelectedClub(club);
    setActiveTab('members');
  };

  const handleBackToClubs = () => {
    setSelectedClub(null);
    setActiveTab('clubs');
    setMembers([]);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          {selectedClub ? (
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackToClubs}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{selectedClub.name}</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedClub.memberCount || 0} members - {selectedClub.postCount || 0} posts
                </p>
              </div>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Clubs & Connect</h1>
              <p className="text-sm text-gray-500 mt-1">Manage clubs and members.</p>
            </div>
          )}
        </div>
        <button
          onClick={() => {
            if (activeTab === 'clubs') fetchClubs(clubPagination.currentPage);
            else if (activeTab === 'members') fetchMembers(memberPagination.currentPage);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-200 rounded-xl p-2 shadow-sm flex gap-2">
        <button
          onClick={() => {
            if (selectedClub) handleBackToClubs();
            else setActiveTab('clubs');
          }}
          className={`flex-1 px-4 py-3 rounded-lg text-sm font-semibold ${
            activeTab === 'clubs' ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Clubs
        </button>
        <button
          onClick={() => setActiveTab('members')}
          disabled={!selectedClub}
          className={`flex-1 px-4 py-3 rounded-lg text-sm font-semibold ${
            activeTab === 'members' ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'
          } ${!selectedClub ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Members
        </button>
      </div>

      {/* Clubs Tab */}
      {activeTab === 'clubs' && (
        <div className="space-y-6">
          {/* Create Club Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Create new club</h2>
                <p className="text-sm text-gray-500">Add a new community for users to join.</p>
              </div>
              {clubError && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  <XCircle className="h-4 w-4" />
                  <span className="text-sm">{clubError}</span>
                </div>
              )}
            </div>

            <form onSubmit={handleCreateClub} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={clubForm.name}
                  onChange={(e) => setClubForm({ ...clubForm, name: e.target.value })}
                  required
                  placeholder="Club name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
                />
                <textarea
                  value={clubForm.description}
                  onChange={(e) => setClubForm({ ...clubForm, description: e.target.value })}
                  rows={2}
                  placeholder="Description"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
                />
              </div>
              <FileUpload
                label="Club Thumbnail"
                value={clubForm.thumbnail}
                onUpload={(url) => setClubForm({ ...clubForm, thumbnail: url })}
                folder="clubs"
                type="image"
                placeholder="Drop club thumbnail here or click to upload"
                disabled={isSubmittingClub}
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingClub}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-60"
                >
                  {isSubmittingClub ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Create club
                </button>
              </div>
            </form>
          </div>

          {/* Club List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={clubFilters.search}
                  onChange={(e) => setClubFilters({ ...clubFilters, search: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && fetchClubs(1)}
                  onBlur={() => fetchClubs(1)}
                  placeholder="Search clubs"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
                />
              </div>
              <button
                onClick={() => {
                  setClubFilters({ search: '' });
                  fetchClubs(1);
                }}
                className="px-3 py-2 text-sm text-gray-600 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200"
              >
                Reset
              </button>
            </div>

            {isLoadingClubs ? (
              <div className="p-6 flex items-center justify-center gap-2 text-gray-600">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading clubs...
              </div>
            ) : clubs.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No clubs found.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
                {clubs.map((club) => (
                  <div
                    key={club._id}
                    className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition"
                  >
                    {/* Thumbnail */}
                    <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 relative">
                      {club.thumbnail ? (
                        <img
                          src={club.thumbnail}
                          alt={club.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Users className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      {club.isDeleted && (
                        <span className="absolute top-2 right-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-700">
                          Deleted
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{club.name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2">{club.description || 'No description'}</p>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {club.memberCount || 0} members
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {club.postCount || 0} posts
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                        <button
                          onClick={() => handleSelectClub(club)}
                          className="flex-1 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-1"
                        >
                          <Users className="h-4 w-4" />
                          View Members
                        </button>
                        <button
                          onClick={() => handleViewStats(club)}
                          className="px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                        >
                          <BarChart3 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditClub(club)}
                          className="flex-1 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg hover:bg-gray-800 flex items-center justify-center gap-1"
                        >
                          <Edit3 className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteClubId(club._id)}
                          className="px-3 py-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {clubPagination.totalPages > 1 && (
              <Pagination
                currentPage={clubPagination.currentPage}
                totalPages={clubPagination.totalPages}
                totalItems={clubPagination.totalCount}
                itemsPerPage={clubPagination.limit}
                onPageChange={(page) => fetchClubs(page)}
                itemLabel="clubs"
              />
            )}
          </div>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && selectedClub && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Club Members</h2>
            <p className="text-sm text-gray-500">{memberPagination.totalCount} members in this club</p>
          </div>

          {isLoadingMembers ? (
            <div className="p-6 flex items-center justify-center gap-2 text-gray-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading members...
            </div>
          ) : memberError ? (
            <div className="p-6 text-center text-red-500">{memberError}</div>
          ) : members.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No members in this club.</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {members.map((member) => (
                <div key={member.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-gray-600 flex items-center justify-center text-white font-bold text-sm">
                      {member.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{member.name || 'Unknown'}</h3>
                      <p className="text-xs text-gray-500">{member.email || member.phone || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{member.followerCount || 0} followers</span>
                    <span className="text-xs text-gray-400">
                      Joined {formatDate(member.joinedAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {memberPagination.totalPages > 1 && (
            <Pagination
              currentPage={memberPagination.currentPage}
              totalPages={memberPagination.totalPages}
              totalItems={memberPagination.totalCount}
              itemsPerPage={memberPagination.limit}
              onPageChange={(page) => fetchMembers(page)}
              itemLabel="members"
            />
          )}
        </div>
      )}

      {/* Edit Club Modal */}
      <Modal
        isOpen={showClubModal}
        onClose={() => {
          setShowClubModal(false);
          setEditingClub(null);
          resetClubForm();
        }}
        title="Edit club"
        size="lg"
      >
        <form onSubmit={handleUpdateClub} className="space-y-4">
          <input
            type="text"
            value={clubForm.name}
            onChange={(e) => setClubForm({ ...clubForm, name: e.target.value })}
            required
            placeholder="Club name"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
          />
          <textarea
            value={clubForm.description}
            onChange={(e) => setClubForm({ ...clubForm, description: e.target.value })}
            rows={3}
            placeholder="Description"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
          />
          <FileUpload
            label="Club Thumbnail"
            value={clubForm.thumbnail}
            onUpload={(url) => setClubForm({ ...clubForm, thumbnail: url })}
            folder="clubs"
            type="image"
            placeholder="Drop club thumbnail here or click to upload"
            disabled={isSubmittingClub}
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowClubModal(false);
                setEditingClub(null);
                resetClubForm();
              }}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingClub}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-60"
            >
              {isSubmittingClub ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit3 className="h-4 w-4" />}
              Save changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Stats Modal */}
      <Modal
        isOpen={showStatsModal}
        onClose={() => {
          setShowStatsModal(false);
          setSelectedClubStats(null);
        }}
        title="Club Statistics"
        size="lg"
      >
        {selectedClubStats && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">{selectedClubStats.clubName}</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-700">{selectedClubStats.totalMembers || 0}</p>
                <p className="text-sm text-blue-600">Total Members</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-700">{selectedClubStats.totalPosts || 0}</p>
                <p className="text-sm text-green-600">Total Posts</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg col-span-2">
                <p className="text-2xl font-bold text-purple-700">{selectedClubStats.recentPosts || 0}</p>
                <p className="text-sm text-purple-600">Recent Posts</p>
              </div>
            </div>

            {selectedClubStats.topPosters?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Top Posters</h4>
                <div className="space-y-2">
                  {selectedClubStats.topPosters.map((poster, idx) => (
                    <div key={poster.userId} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-gray-800 text-white text-xs flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium text-gray-900">{poster.name}</span>
                      </div>
                      <span className="text-sm text-gray-600">{poster.postCount} posts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Club Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteClubId}
        onClose={() => setDeleteClubId(null)}
        onConfirm={handleDeleteClub}
        title="Delete club"
        message="This will delete the club and all associated data (members, posts). This action cannot be undone."
        confirmText="Delete club"
        variant="danger"
        isLoading={actionLoading}
      />
    </div>
  );
}

export default Clubs;
