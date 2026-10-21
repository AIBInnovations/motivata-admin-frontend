import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Loader2,
  Plus,
  RefreshCw,
  XCircle,
  Trash2,
  Images,
  Globe,
  Edit,
  Search,
  Save,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import explorePostsService from '../services/explore-posts.service';
import { formatApiError } from '../services/api.service';
import FileUpload from '../components/ui/FileUpload';
import Pagination from '../components/ui/Pagination';

const POSTS_PER_PAGE = 20;
const EDITABLE_TEXT_FIELDS = ['title', 'subHeading', 'category', 'content', 'caption', 'videoUrl', 'linkUrl'];

const defaultForm = {
  title: '',
  subHeading: '',
  category: '',
  content: '',
  caption: '',
  videoUrl: '',
  linkUrl: '',
  mediaUrls: [],
};

const LINK_PATTERN = /^https?:\/\/\S+$/i;

const countWords = (text) => text.trim().split(/\s+/).filter(Boolean).length;

const normalizeLineEndings = (text) => String(text || '').replace(/\r\n?/g, '\n');

const buildChanges = (original, current) => {
  const changes = {};
  EDITABLE_TEXT_FIELDS.forEach((key) => {
    if (normalizeLineEndings(original[key]).trim() !== normalizeLineEndings(current[key])) {
      changes[key] = current[key];
    }
  });
  const originalMedia = original.mediaUrls || [];
  const mediaChanged =
    originalMedia.length !== current.mediaUrls.length ||
    originalMedia.some((url, index) => url !== current.mediaUrls[index]);
  if (mediaChanged) {
    changes.mediaUrls = current.mediaUrls;
  }
  return changes;
};

function ExplorePosts() {
  const { hasRole } = useAuth();
  const canManageAll = hasRole(['SUPER_ADMIN', 'ADMIN']);
  const canModifyPost = (post) => canManageAll || post.isOwnPost === true;
  const formCardRef = useRef(null);
  const requestIdRef = useRef(0);

  const [form, setForm] = useState(defaultForm);
  const [editingPost, setEditingPost] = useState(null);
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    limit: POSTS_PER_PAGE,
  });
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [listError, setListError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [categories, setCategories] = useState([]);
  const [maxWords, setMaxWords] = useState(100);

  const isEditing = editingPost !== null;

  useEffect(() => {
    explorePostsService.getCategories().then((res) => {
      if (res.success) {
        setCategories(res.data?.categories || []);
        setMaxWords(res.data?.maxWords || 100);
      }
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchPosts = useCallback(async () => {
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;
    setIsLoading(true);
    setListError(null);
    const params = { page, limit: POSTS_PER_PAGE };
    if (search) params.search = search;
    const result = await explorePostsService.getPosts(params);
    if (requestId !== requestIdRef.current) return;
    if (result.success) {
      setPosts(result.data?.posts || []);
      setPagination(
        result.data?.pagination || {
          currentPage: page,
          totalPages: 0,
          totalCount: 0,
          limit: POSTS_PER_PAGE,
        }
      );
    } else {
      setPosts([]);
      setListError(formatApiError(result.error || result.message, 'Failed to load posts'));
    }
    setIsLoading(false);
  }, [page, search]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const resetForm = () => {
    setForm(defaultForm);
    setEditingPost(null);
    setError(null);
    setSuccess(null);
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setForm({
      title: post.title || '',
      subHeading: post.subHeading || '',
      category: post.category || '',
      content: post.content || '',
      caption: post.caption || '',
      videoUrl: post.videoUrl || '',
      linkUrl: post.linkUrl || '',
      mediaUrls: post.mediaUrls || [],
    });
    setError(null);
    setSuccess(null);
    formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    if (form.mediaUrls.length === 0) {
      setError('Please upload at least one photo');
      return;
    }
    if (!isEditing && countWords(form.content) > maxWords) {
      setError(`Text cannot be more than ${maxWords} words`);
      return;
    }
    if (form.videoUrl.trim() && !LINK_PATTERN.test(form.videoUrl.trim())) {
      setError('Video link must start with http:// or https://');
      return;
    }
    if (form.linkUrl.trim() && !LINK_PATTERN.test(form.linkUrl.trim())) {
      setError('Link must start with http:// or https://');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const payload = {
      title: form.title.trim(),
      subHeading: form.subHeading.trim(),
      category: form.category,
      content: form.content.trim(),
      caption: form.caption.trim(),
      videoUrl: form.videoUrl.trim(),
      linkUrl: form.linkUrl.trim(),
      mediaUrls: form.mediaUrls,
    };

    if (isEditing) {
      const changes = buildChanges(editingPost, payload);
      if (Object.keys(changes).length === 0) {
        setError('Nothing to save, no fields were changed');
        setIsSubmitting(false);
        return;
      }
      if ('content' in changes && countWords(changes.content) > maxWords) {
        setError(`Text cannot be more than ${maxWords} words`);
        setIsSubmitting(false);
        return;
      }

      const updateResult = await explorePostsService.updatePost(editingPost.id, changes);
      if (updateResult.success) {
        resetForm();
        setSuccess('Post updated');
        fetchPosts();
      } else {
        setError(formatApiError(updateResult.error || updateResult.message, 'Failed to update post'));
      }
      setIsSubmitting(false);
      return;
    }

    const result = await explorePostsService.createPost(payload);

    if (result.success) {
      resetForm();
      setSuccess('Post published to Explore tab!');
      if (page === 1) {
        fetchPosts();
      } else {
        setPage(1);
      }
    } else {
      setError(formatApiError(result.error || result.message, 'Failed to create post'));
    }

    setIsSubmitting(false);
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Delete this post? It will be removed from the Explore tab.')) return;
    setDeletingId(postId);
    const result = await explorePostsService.deletePost(postId);
    if (result.success) {
      if (editingPost?.id === postId) {
        resetForm();
      }
      if (posts.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchPosts();
      }
    } else {
      alert(formatApiError(result.error || result.message, 'Failed to delete post'));
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
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Create Post Form */}
      <div ref={formCardRef} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">
          {isEditing ? 'Edit Post' : 'Create New Post'}
        </h2>
        <p className="text-xs text-gray-500 mb-5">
          Posts appear as 'Motivata' in the app.
        </p>

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

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-900">
              Sub-heading <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <input
              type="text"
              value={form.subHeading}
              onChange={(e) => setForm({ ...form, subHeading: e.target.value })}
              maxLength={200}
              placeholder="A short line under the title..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-900">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none text-sm bg-white"
            >
              <option value="">— Choose a category —</option>
              {form.category && !categories.includes(form.category) && (
                <option value={form.category}>{form.category}</option>
              )}
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Content */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-900">Text</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={5}
              maxLength={5000}
              placeholder={`Write up to ${maxWords} words about this post...`}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none resize-none text-sm"
            />
            <p className={`text-xs ${countWords(form.content) > maxWords ? 'text-red-600' : 'text-gray-400'}`}>
              {countWords(form.content)}/{maxWords} words
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-900">
                Video link <span className="text-gray-400 text-xs">(YouTube / Instagram, optional)</span>
              </label>
              <input
                type="url"
                value={form.videoUrl}
                onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-900">
                External link <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <input
                type="url"
                value={form.linkUrl}
                onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none text-sm"
              />
            </div>
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
            <p className="text-xs text-gray-500">
              Recommended 1080x1080 (1:1). Other ratios get cropped in the app.
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
              {isEditing ? 'Cancel edit' : 'Reset'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !form.title.trim() || form.mediaUrls.length === 0}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isEditing ? 'Saving...' : 'Publishing...'}
                </>
              ) : isEditing ? (
                <>
                  <Save className="h-4 w-4" />
                  Save changes
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
        <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-base font-semibold text-gray-900">
            All Explore Posts ({pagination.totalCount})
          </h2>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by title, caption or text..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none text-sm"
            />
          </div>
        </div>

        {listError && (
          <div className="m-4 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            <XCircle className="h-4 w-4 shrink-0" />
            <span className="text-sm flex-1">{listError}</span>
            <button
              onClick={fetchPosts}
              className="text-sm font-medium underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading posts...
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Images className="h-10 w-10 mb-3" />
            <p className="text-sm">
              {search
                ? 'No posts match your search.'
                : 'No posts yet. Create your first Explore post above.'}
            </p>
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
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{post.title}</p>
                    {post.isOwnPost && (
                      <span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-900 text-white">
                        Yours
                      </span>
                    )}
                  </div>
                  {(post.category || post.subHeading) && (
                    <p className="text-xs text-gray-500 truncate">
                      {[post.category, post.subHeading].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  {post.content && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{post.content}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-gray-400">
                    <span>By {post.author?.name || 'Unknown'}</span>
                    <span>•</span>
                    <span>{post.mediaUrls?.length || 0} photo{post.mediaUrls?.length !== 1 ? 's' : ''}</span>
                    <span>•</span>
                    <span>{post.likeCount || 0} likes</span>
                    <span>•</span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {canModifyPost(post) && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleEdit(post)}
                      disabled={isSubmitting}
                      className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                      title="Edit post"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      disabled={deletingId === post.id}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete post"
                    >
                      {deletingId === post.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {pagination.totalPages > 1 && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalCount}
            itemsPerPage={pagination.limit}
            onPageChange={setPage}
            itemLabel="posts"
          />
        )}
      </div>
    </div>
  );
}

export default ExplorePosts;
