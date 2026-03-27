import { useEffect, useState } from 'react';
import { Loader2, RefreshCw, XCircle, Briefcase, ChevronDown, Users, Mail, Phone, FileText } from 'lucide-react';
import jobsService from '../services/jobs.service';

const STATUSES = ['PENDING', 'REVIEWED', 'SHORTLISTED', 'REJECTED', 'HIRED'];

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  REVIEWED: 'bg-blue-100 text-blue-700',
  SHORTLISTED: 'bg-purple-100 text-purple-700',
  REJECTED: 'bg-red-100 text-red-700',
  HIRED: 'bg-green-100 text-green-700',
};

function JobApplications() {
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterJobId, setFilterJobId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchJobs();
    fetchApplications();
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [filterJobId, filterStatus]);

  const fetchJobs = async () => {
    const result = await jobsService.getJobs();
    if (result.success) setJobs(result.data?.jobs || []);
  };

  const fetchApplications = async () => {
    setIsLoading(true);
    setError(null);
    const params = {};
    if (filterStatus) params.status = filterStatus;

    let result;
    if (filterJobId) {
      result = await jobsService.getJobApplications(filterJobId, params);
    } else {
      result = await jobsService.getAllApplications(params);
    }

    if (result.success) {
      setApplications(result.data?.applications || []);
    } else {
      setError(result.message || 'Failed to fetch applications');
    }
    setIsLoading(false);
  };

  const handleStatusChange = async (applicationId, newStatus) => {
    setUpdatingId(applicationId);
    const result = await jobsService.updateApplicationStatus(applicationId, newStatus);
    if (result.success) {
      setApplications(prev =>
        prev.map(a => a._id === applicationId ? { ...a, status: newStatus } : a)
      );
    }
    setUpdatingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6" /> Job Applications
          </h1>
          <p className="text-sm text-gray-500 mt-1">Review and manage applicants</p>
        </div>
        <button onClick={fetchApplications} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={filterJobId}
          onChange={e => setFilterJobId(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-gray-800 bg-white"
        >
          <option value="">All Jobs</option>
          {jobs.map(j => (
            <option key={j._id} value={j._id}>{j.title} — {j.company}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-gray-800 bg-white"
        >
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          <XCircle className="h-4 w-4 shrink-0" /><span className="text-sm">{error}</span>
        </div>
      )}

      {/* Applications List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Applications ({applications.length})</h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading...
          </div>
        ) : applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Briefcase className="h-10 w-10 mb-3" />
            <p className="text-sm">No applications found.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {applications.map(app => (
              <li key={app._id} className="px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-gray-900">{app.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[app.status]}`}>
                        {app.status}
                      </span>
                    </div>
                    {app.job && (
                      <p className="text-sm text-gray-600 font-medium">{app.job.title} · {app.job.company}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{app.email}</span>
                      {app.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{app.phone}</span>}
                      <span>{new Date(app.createdAt).toLocaleDateString()}</span>
                    </div>

                    {/* Expandable cover letter */}
                    {app.coverLetter && (
                      <button
                        onClick={() => setExpandedId(expandedId === app._id ? null : app._id)}
                        className="mt-2 text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1"
                      >
                        <FileText className="h-3 w-3" />
                        {expandedId === app._id ? 'Hide' : 'View'} Cover Letter
                        <ChevronDown className={`h-3 w-3 transition-transform ${expandedId === app._id ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                    {expandedId === app._id && app.coverLetter && (
                      <p className="mt-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3 border border-gray-200 whitespace-pre-wrap">
                        {app.coverLetter}
                      </p>
                    )}
                  </div>

                  {/* Status select */}
                  <div className="shrink-0">
                    {updatingId === app._id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    ) : (
                      <select
                        value={app.status}
                        onChange={e => handleStatusChange(app._id, e.target.value)}
                        className="text-xs px-2 py-1.5 border border-gray-300 rounded-lg outline-none focus:border-gray-800 bg-white"
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
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

export default JobApplications;
