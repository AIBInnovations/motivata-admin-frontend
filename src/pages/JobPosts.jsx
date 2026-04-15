import { useEffect, useRef, useState } from 'react';
import { Loader2, Plus, Trash2, RefreshCw, XCircle, Briefcase, Users, ToggleLeft, ToggleRight, ChevronDown, Image as ImageIcon, Upload, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import jobsService from '../services/jobs.service';
import clubsService from '../services/clubs.service';
import Modal from '../components/ui/Modal';

const JOB_TYPES = [
  { value: 'FULL_TIME', label: 'Full Time' },
  { value: 'PART_TIME', label: 'Part Time' },
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'FREELANCE', label: 'Freelance' },
];

const TYPE_COLORS = {
  FULL_TIME: 'bg-green-100 text-green-700',
  PART_TIME: 'bg-blue-100 text-blue-700',
  INTERNSHIP: 'bg-purple-100 text-purple-700',
  CONTRACT: 'bg-orange-100 text-orange-700',
  FREELANCE: 'bg-pink-100 text-pink-700',
};

const defaultForm = {
  title: '', company: '', location: '', type: 'FULL_TIME',
  description: '', requirements: '', salary: '', deadline: '', imageUrl: '',
};

function JobPosts() {
  const { hasRole } = useAuth();
  const canManage = hasRole(['SUPER_ADMIN', 'ADMIN']);

  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  // Job image upload state
  const [jobImage, setJobImage] = useState(null); // { id, status, url, errorMsg }
  const jobFileInputRef = useRef(null);

  const handleJobImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const placeholder = { id: `${Date.now()}`, file, status: 'uploading', url: null, errorMsg: null };
    setJobImage(placeholder);
    if (jobFileInputRef.current) jobFileInputRef.current.value = '';
    const result = await clubsService.uploadMedia(file);
    if (result.success && result.data?.mediaUrl) {
      setJobImage({ ...placeholder, status: 'done', url: result.data.mediaUrl });
      setForm((prev) => ({ ...prev, imageUrl: result.data.mediaUrl }));
    } else {
      setJobImage({ ...placeholder, status: 'error', errorMsg: result.message || 'Upload failed' });
    }
  };

  const handleRemoveJobImage = () => {
    setJobImage(null);
    setForm((prev) => ({ ...prev, imageUrl: '' }));
  };

  // Create club post state
  const [showPostModal, setShowPostModal] = useState(false);
  const [postImages, setPostImages] = useState([]);
  const [postCaption, setPostCaption] = useState('');
  const [postError, setPostError] = useState('');
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [doersClubId, setDoersClubId] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => { fetchJobs(); fetchDoersClub(); }, []);

  const fetchJobs = async () => {
    setIsLoading(true);
    const result = await jobsService.getJobs();
    if (result.success) setJobs(result.data?.jobs || []);
    setIsLoading(false);
  };

  // Find the Doer's Club by name so we know which clubId to post to
  const fetchDoersClub = async () => {
    const result = await clubsService.getClubs({ page: 1, limit: 100 });
    if (result.success) {
      const clubs = result.data?.clubs || [];
      const doers = clubs.find((c) =>
        c.name?.toLowerCase().includes("doer")
      );
      if (doers) setDoersClubId(doers._id);
    }
  };

  const openPostModal = () => {
    setPostImages([]);
    setPostCaption('');
    setPostError('');
    setShowPostModal(true);
  };

  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = 10 - postImages.length;
    const toUpload = files.slice(0, remaining);

    const placeholders = toUpload.map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      status: 'uploading',
      url: null,
      errorMsg: null,
    }));

    setPostImages((prev) => [...prev, ...placeholders]);
    setPostError('');
    if (fileInputRef.current) fileInputRef.current.value = '';

    await Promise.all(
      placeholders.map(async (placeholder) => {
        const result = await clubsService.uploadMedia(placeholder.file);
        setPostImages((prev) =>
          prev.map((img) => {
            if (img.id !== placeholder.id) return img;
            if (result.success && result.data?.mediaUrl) {
              return { ...img, status: 'done', url: result.data.mediaUrl };
            }
            return { ...img, status: 'error', errorMsg: result.message || 'Upload failed' };
          })
        );
      })
    );
  };

  const handleRemoveImage = (id) => {
    setPostImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleSubmitPost = async () => {
    const uploadedUrls = postImages
      .filter((img) => img.status === 'done')
      .map((img) => img.url);

    if (uploadedUrls.length === 0) {
      setPostError('Please upload at least one image');
      return;
    }

    if (!doersClubId) {
      setPostError("Doer's Club not found. Make sure the club exists.");
      return;
    }

    setIsSubmittingPost(true);
    setPostError('');

    const payload = { mediaUrls: uploadedUrls };
    if (postCaption.trim()) payload.caption = postCaption.trim();

    const result = await clubsService.createPost(doersClubId, payload);
    setIsSubmittingPost(false);

    if (result.success) {
      toast.success('Post created successfully');
      setShowPostModal(false);
    } else {
      setPostError(result.message || 'Failed to create post');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canManage) return;
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const result = await jobsService.createJob({
      ...form,
      deadline: form.deadline || undefined,
    });

    if (result.success) {
      setSuccess('Job post created successfully!');
      setForm(defaultForm);
      setJobImage(null);
      setShowForm(false);
      fetchJobs();
    } else {
      setError(result.message || 'Failed to create job');
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this job post?')) return;
    setDeletingId(id);
    const result = await jobsService.deleteJob(id);
    if (result.success) setJobs(prev => prev.filter(j => j._id !== id));
    else alert(result.message || 'Failed to delete');
    setDeletingId(null);
  };

  const handleToggleActive = async (job) => {
    setTogglingId(job._id);
    const result = await jobsService.updateJob(job._id, { isActive: !job.isActive });
    if (result.success) {
      setJobs(prev => prev.map(j => j._id === job._id ? { ...j, isActive: !j.isActive } : j));
    }
    setTogglingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Briefcase className="h-6 w-6" /> Job Posts
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage Doer's Club job listings</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchJobs} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          {canManage && (
            <>
              <button
                onClick={openPostModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                <ImageIcon className="h-4 w-4" /> Create Post
              </button>
              <button onClick={() => { setShowForm(!showForm); setError(null); setSuccess(null); if (showForm) { setForm(defaultForm); setJobImage(null); } }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800">
                <Plus className="h-4 w-4" /> Create Job
              </button>
            </>
          )}
        </div>
      </div>

      {/* Alerts */}
      {success && <div className="px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-medium">{success}</div>}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          <XCircle className="h-4 w-4 shrink-0" /><span className="text-sm">{error}</span>
        </div>
      )}

      {/* Create Form */}
      {showForm && canManage && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-5">New Job Post</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-900">Title <span className="text-red-500">*</span></label>
                <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Frontend Developer"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-gray-800" />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-900">Company <span className="text-red-500">*</span></label>
                <input required value={form.company} onChange={e => setForm({ ...form, company: e.target.value })}
                  placeholder="e.g. Motivata"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-gray-800" />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-900">Location <span className="text-red-500">*</span></label>
                <input required value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. Remote / Mumbai"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-gray-800" />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-900">Type <span className="text-red-500">*</span></label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-gray-800 bg-white">
                  {JOB_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-900">Salary</label>
                <input value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })}
                  placeholder="e.g. ₹5-8 LPA"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-gray-800" />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-900">Deadline</label>
                <input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-gray-800" />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-900">Description <span className="text-red-500">*</span></label>
              <textarea required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                rows={4} placeholder="Job description..."
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-gray-800 resize-none" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-900">Requirements</label>
              <textarea value={form.requirements} onChange={e => setForm({ ...form, requirements: e.target.value })}
                rows={3} placeholder="Skills, qualifications..."
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-gray-800 resize-none" />
            </div>

            {/* Job Image Upload */}
            <div>
              <label className="text-sm font-semibold text-gray-900">Job Image</label>
              <p className="text-xs text-gray-400 mb-2">Optional banner image for the job post</p>
              <input
                ref={jobFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleJobImageSelect}
              />
              {!jobImage ? (
                <button
                  type="button"
                  onClick={() => jobFileInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center gap-2 px-4 py-5 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Upload className="h-5 w-5" />
                  <span className="text-sm font-medium">Click to upload image</span>
                  <span className="text-xs text-gray-400">JPEG, PNG, GIF, WEBP</span>
                </button>
              ) : (
                <div className="relative w-full h-40 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                  {jobImage.status === 'uploading' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                      <span className="text-xs text-gray-500 mt-1">Uploading…</span>
                    </div>
                  )}
                  {jobImage.status === 'done' && (
                    <>
                      <img src={jobImage.url} alt="Job banner" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={handleRemoveJobImage}
                        className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                  {jobImage.status === 'error' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 p-4">
                      <XCircle className="h-5 w-5 text-red-500 mb-1" />
                      <span className="text-xs text-red-600 text-center">{jobImage.errorMsg || 'Upload failed'}</span>
                      <button type="button" onClick={handleRemoveJobImage} className="mt-2 text-xs text-red-500 underline">Remove</button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
              <button type="button" onClick={() => { setShowForm(false); setForm(defaultForm); setJobImage(null); }}
                className="px-5 py-2.5 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-60">
                {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" />Creating...</> : <><Plus className="h-4 w-4" />Create Job</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Jobs List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">All Jobs ({jobs.length})</h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading...
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Briefcase className="h-10 w-10 mb-3" />
            <p className="text-sm">No job posts yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {jobs.map(job => (
              <li key={job._id} className="px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-gray-900">{job.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[job.type]}`}>
                        {JOB_TYPES.find(t => t.value === job.type)?.label}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${job.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {job.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{job.company} · {job.location}</p>
                    {job.salary && <p className="text-xs text-gray-500 mt-0.5">{job.salary}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{job.applicationCount} applications</span>
                      {job.deadline && <span>Deadline: {new Date(job.deadline).toLocaleDateString()}</span>}
                      <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handleToggleActive(job)} disabled={togglingId === job._id}
                      className="p-2 text-gray-400 hover:text-gray-700 rounded-lg transition-colors" title={job.isActive ? 'Deactivate' : 'Activate'}>
                      {togglingId === job._id ? <Loader2 className="h-4 w-4 animate-spin" /> : job.isActive ? <ToggleRight className="h-5 w-5 text-green-500" /> : <ToggleLeft className="h-5 w-5" />}
                    </button>
                    <a href={`/job-applications?jobId=${job._id}`}
                      className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                      Applications
                    </a>
                    {canManage && (
                      <button onClick={() => handleDelete(job._id)} disabled={deletingId === job._id}
                        className="p-2 text-gray-400 hover:text-red-500 rounded-lg transition-colors">
                        {deletingId === job._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* Create Post Modal */}
      <Modal
        isOpen={showPostModal}
        onClose={() => setShowPostModal(false)}
        title="Create Post"
        size="lg"
      >
        <div className="space-y-5">
          {/* Image Upload Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Images <span className="text-red-500">*</span>
              <span className="text-gray-400 font-normal ml-1">(max 10)</span>
            </label>

            {postImages.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
                {postImages.map((img) => (
                  <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                    {img.status === 'uploading' && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                        <span className="text-xs text-gray-500 mt-1">Uploading…</span>
                      </div>
                    )}
                    {img.status === 'done' && (
                      <>
                        <img src={img.url} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(img.id)}
                          className="absolute top-1 right-1 p-0.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                    {img.status === 'error' && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 p-2">
                        <XCircle className="h-5 w-5 text-red-500 mb-1" />
                        <span className="text-xs text-red-600 text-center line-clamp-2">
                          {img.errorMsg || 'Upload failed'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(img.id)}
                          className="mt-1 text-xs text-red-500 underline"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {postImages.length < 10 && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  multiple
                  className="hidden"
                  onChange={handleImageSelect}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Upload className="h-6 w-6" />
                  <span className="text-sm font-medium">Click to select images</span>
                  <span className="text-xs text-gray-400">JPEG, PNG, GIF, WEBP · Max 50 MB each</span>
                </button>
              </>
            )}

            {postError && (
              <p className="text-sm text-red-600 mt-2">{postError}</p>
            )}
          </div>

          {/* Caption */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Caption
              <span className="text-gray-400 font-normal ml-1">(optional)</span>
            </label>
            <textarea
              value={postCaption}
              onChange={(e) => setPostCaption(e.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="Write a caption…"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none resize-none text-sm transition-colors"
            />
            <p className="text-xs text-gray-400 text-right mt-0.5">
              {postCaption.length}/2000
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowPostModal(false)}
              disabled={isSubmittingPost}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmitPost}
              disabled={
                isSubmittingPost ||
                postImages.filter((img) => img.status === 'done').length === 0
              }
              className="inline-flex items-center gap-2 px-5 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 text-sm font-medium transition-colors"
            >
              {isSubmittingPost ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Post
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default JobPosts;
