import { useEffect, useState } from 'react';
import {
  Loader2,
  Plus,
  RefreshCw,
  XCircle,
  Trash2,
  Images,
  Globe,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import explorePostsService from '../services/explore-posts.service';
import FileUpload from '../components/ui/FileUpload';

const defaultForm = {
  title: '',
  content: '',
  caption: '',
  mediaUrls: [],
};

function ExplorePosts() {
  const { hasRole } = useAuth();
  const canManage = hasRole(['SUPER_ADMIN', 'ADMIN']);

  const [form, setForm] = useState(defaultForm);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setIsLoading(true);
    const result = await explorePostsService.getPosts({ page: 1, limit: 20 });
    if (result.success) {
      setPosts(result.data?.posts || []);
    }
    setIsLoading(false);
  };

  const resetForm = () => {
    setForm(defaultForm);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canManage) return;

    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    if (form.mediaUrls.length === 0) {
      setError('Please upload at least one photo');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const result = await explorePostsService.createPost({
      title: form.title.trim(),
      content: form.content.trim(),
      caption: form.caption.trim(),
      mediaUrls: form.mediaUrls,
    });

    if (result.success) {
      setSuccess('Post published to Explore tab!');
      resetForm();
      fetchPosts();
    } else {
      setError(result.message || 'Failed to create post');
    }

    setIsSubmitting(false);
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Delete this post? It will be removed from the Explore tab.')) return;
    setDeletingId(postId);
    const result = await explorePostsService.deletePost(postId);
    if (result.success) {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } else {
      alert(result.message || 'Failed to delete post');
    }
    setDeletingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="h-6 w-6" />
            Explore Posts
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Posts created here appear in the Explore tab for all users
          </p>
        </div>
        <button
          onClick={fetchPosts}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Create Post Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Create New Post</h2>

        {success && (
          <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-medium">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            <XCircle className="h-4 w-4 shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-900">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              maxLength={200}
              placeholder="Enter post title..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none text-sm"
            />
          </div>

          {/* Content */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-900">Content / Context</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={5}
              maxLength={5000}
              placeholder="Write the full content or context for this post..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none resize-none text-sm"
            />
            <p className="text-xs text-gray-400">{form.content.length}/5000</p>
          </div>

          {/* Caption */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-900">Short Caption</label>
            <input
              type="text"
              value={form.caption}
              onChange={(e) => setForm({ ...form, caption: e.target.value })}
              maxLength={200}
              placeholder="Optional short caption..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none text-sm"
            />
          </div>

          {/* Photos */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-900">
              Photos <span className="text-red-500">*</span>
            </label>
            <FileUpload
              multiple
              values={form.mediaUrls}
              onUpload={(urls) => setForm({ ...form, mediaUrls: urls })}
              folder="explore-posts"
              type="image"
              maxSize={10 * 1024 * 1024}
              placeholder="Drop photos here or click to upload (up to 10)"
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500">
              Upload up to 10 photos. First photo will be used as the cover.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={resetForm}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-60"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !form.title.trim() || form.mediaUrls.length === 0}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Publish to Explore
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Posts List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">
            Published Posts ({posts.length})
          </h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading posts...
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Images className="h-10 w-10 mb-3" />
            <p className="text-sm">No posts yet. Create your first Explore post above.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {posts.map((post) => (
              <li key={post.id} className="flex items-start gap-4 px-6 py-4">
                {/* Thumbnail */}
                {post.mediaUrls?.[0] && (
                  <img
                    src={post.mediaUrls[0]}
                    alt={post.title}
                    className="w-16 h-16 object-cover rounded-lg shrink-0 border border-gray-200"
                  />
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{post.title}</p>
                  {post.content && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{post.content}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>{post.mediaUrls?.length || 0} photo{post.mediaUrls?.length !== 1 ? 's' : ''}</span>
                    <span>•</span>
                    <span>{post.likeCount || 0} likes</span>
                    <span>•</span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Delete */}
                {canManage && (
                  <button
                    onClick={() => handleDelete(post.id)}
                    disabled={deletingId === post.id}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 shrink-0"
                    title="Delete post"
                  >
                    {deletingId === post.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default ExplorePosts;
