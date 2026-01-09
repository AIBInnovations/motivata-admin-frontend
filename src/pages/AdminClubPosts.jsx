import { useEffect, useState } from 'react';
import {
  Loader2,
  Plus,
  RefreshCw,
  XCircle,
  Image,
  Video,
  Globe,
  UsersRound,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import clubsService from '../services/clubs.service';
import clubPostsService from '../services/club-posts.service';
import FileUpload from '../components/ui/FileUpload';
import PostPermissionBadges from '../components/PostPermissionBadges';

const defaultPostForm = {
  caption: '',
  mediaType: 'IMAGE',
  mediaUrls: [],
  mediaThumbnail: '',
  clubId: '',
};

function AdminClubPosts() {
  const { hasRole } = useAuth();
  const canManage = hasRole(['SUPER_ADMIN', 'ADMIN']);

  const [clubs, setClubs] = useState([]);
  const [postForm, setPostForm] = useState(defaultPostForm);
  const [isLoadingClubs, setIsLoadingClubs] = useState(false);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    setIsLoadingClubs(true);
    setError(null);

    const result = await clubsService.getClubs({ page: 1, limit: 100 });
    if (result.success) {
      setClubs(result.data?.clubs || []);
    } else {
      setError(result.message || 'Failed to load clubs');
    }

    setIsLoadingClubs(false);
  };

  const resetForm = () => {
    setPostForm(defaultPostForm);
    setError(null);
    setSuccess(null);
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!canManage) return;

    // Validation
    if (!postForm.clubId) {
      setError('Please select a club');
      return;
    }

    if (postForm.mediaUrls.length === 0) {
      setError('Please upload at least one media file');
      return;
    }

    setIsSubmittingPost(true);
    setError(null);
    setSuccess(null);

    const result = await clubPostsService.createPost({
      caption: postForm.caption.trim(),
      mediaType: postForm.mediaType,
      mediaUrls: postForm.mediaUrls,
      mediaThumbnail: postForm.mediaThumbnail || undefined,
      clubId: postForm.clubId,
    });

    if (result.success) {
      setSuccess('Post created successfully!');
      resetForm();
    } else {
      setError(result.message || 'Failed to create post');
    }

    setIsSubmittingPost(false);
  };

  const getSelectedClub = () => {
    return clubs.find((club) => club._id === postForm.clubId);
  };

  const getClubAccessInfo = (club) => {
    const permissions = club.postPermissions || ['MEMBERS'];

    if (permissions.includes('ANYONE')) {
      return <span className="text-green-600">✓ Open to all</span>;
    }
    if (permissions.includes('ADMIN')) {
      return <span className="text-green-600">✓ You have posting access (Admin)</span>;
    }
    if (permissions.includes('MEMBERS')) {
      return club.isJoined ? (
        <span className="text-green-600">✓ Member</span>
      ) : (
        <span className="text-orange-600">⚠ Not a member</span>
      );
    }
    return <span className="text-gray-600">No posting access</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Club Post (Admin)</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create posts in clubs as an administrator
          </p>
        </div>
        <button
          onClick={fetchClubs}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Clubs
        </button>
      </div>

      {/* Create Post Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {/* Success Message */}
        {success && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            <span className="text-sm font-medium">{success}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            <XCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleCreatePost} className="space-y-5">
          {/* Club Selection */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-900">
              Select Club <span className="text-red-500">*</span>
            </label>
            {isLoadingClubs ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading clubs...
              </div>
            ) : (
              <select
                required
                value={postForm.clubId}
                onChange={(e) => setPostForm({ ...postForm, clubId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none bg-white"
              >
                <option value="">-- Choose a club --</option>
                {clubs.map((club) => (
                  <option key={club._id} value={club._id}>
                    {club.name} ({club.memberCount || 0} members)
                  </option>
                ))}
              </select>
            )}

            {/* Show selected club info */}
            {postForm.clubId && getSelectedClub() && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900">
                    {getSelectedClub().name}
                  </span>
                  <PostPermissionBadges permissions={getSelectedClub().postPermissions || ['MEMBERS']} />
                </div>
                <div className="text-xs text-gray-600">
                  {getClubAccessInfo(getSelectedClub())}
                </div>
              </div>
            )}
          </div>

          {/* Caption */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-900">Caption</label>
            <textarea
              value={postForm.caption}
              onChange={(e) => setPostForm({ ...postForm, caption: e.target.value })}
              rows={4}
              placeholder="Write something about this post..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none resize-none"
            />
            <p className="text-xs text-gray-500">Optional - Add a caption to your post</p>
          </div>

          {/* Media Type */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-900">
              Media Type <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPostForm({ ...postForm, mediaType: 'IMAGE', mediaUrls: [] })}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  postForm.mediaType === 'IMAGE'
                    ? 'border-gray-900 bg-gray-50 text-gray-900'
                    : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                }`}
              >
                <Image className="h-5 w-5" />
                <span className="font-semibold">Image(s)</span>
              </button>
              <button
                type="button"
                onClick={() => setPostForm({ ...postForm, mediaType: 'VIDEO', mediaUrls: [] })}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  postForm.mediaType === 'VIDEO'
                    ? 'border-gray-900 bg-gray-50 text-gray-900'
                    : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                }`}
              >
                <Video className="h-5 w-5" />
                <span className="font-semibold">Video</span>
              </button>
            </div>
          </div>

          {/* Media Upload */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-900">
              {postForm.mediaType === 'IMAGE' ? 'Upload Images' : 'Upload Video'}{' '}
              <span className="text-red-500">*</span>
            </label>
            <FileUpload
              value={postForm.mediaUrls[0] || ''}
              onUpload={(url) => setPostForm({ ...postForm, mediaUrls: [url] })}
              folder={postForm.mediaType === 'IMAGE' ? 'club-posts/images' : 'club-posts/videos'}
              type={postForm.mediaType === 'IMAGE' ? 'image' : 'video'}
              placeholder={`Drop ${postForm.mediaType === 'IMAGE' ? 'image' : 'video'} here or click to upload`}
              disabled={isSubmittingPost}
            />
            {postForm.mediaType === 'IMAGE' && (
              <p className="text-xs text-gray-500">
                You can upload multiple images by clicking "Add More" after uploading the first one
              </p>
            )}
          </div>

          {/* Video Thumbnail (only for video) */}
          {postForm.mediaType === 'VIDEO' && postForm.mediaUrls.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-900">Video Thumbnail (Optional)</label>
              <FileUpload
                value={postForm.mediaThumbnail}
                onUpload={(url) => setPostForm({ ...postForm, mediaThumbnail: url })}
                folder="club-posts/thumbnails"
                type="image"
                placeholder="Drop thumbnail image here or click to upload"
                disabled={isSubmittingPost}
              />
              <p className="text-xs text-gray-500">
                Upload a thumbnail image for the video preview
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={resetForm}
              disabled={isSubmittingPost}
              className="px-5 py-2.5 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-60"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={isSubmittingPost || !postForm.clubId || postForm.mediaUrls.length === 0}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmittingPost ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Post...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Post
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">ℹ️ About Posting Permissions</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Admins:</strong> You can always post in clubs with admin permission</li>
          <li>• <strong>Members:</strong> You need to be a member of the club to post</li>
          <li>• <strong>Anyone:</strong> Any authenticated user can post (no membership required)</li>
          <li>• <strong>Multiple permissions:</strong> Clubs can allow both admins and members to post</li>
        </ul>
      </div>
    </div>
  );
}

export default AdminClubPosts;
