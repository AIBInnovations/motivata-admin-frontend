import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, RefreshCw, XCircle, Briefcase, Users, ToggleLeft, ToggleRight, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import jobsService from '../services/jobs.service';

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
  description: '', requirements: '', salary: '', deadline: '',
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

  useEffect(() => { fetchJobs(); }, []);

  const fetchJobs = async () => {
    setIsLoading(true);
    const result = await jobsService.getJobs();
    if (result.success) setJobs(result.data?.jobs || []);
    setIsLoading(false);
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
            <button onClick={() => { setShowForm(!showForm); setError(null); setSuccess(null); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800">
              <Plus className="h-4 w-4" /> Create Job
            </button>
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
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
              <button type="button" onClick={() => { setShowForm(false); setForm(defaultForm); }}
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
    </div>
  );
}

export default JobPosts;
