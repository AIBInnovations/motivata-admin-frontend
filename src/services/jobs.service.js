import { api, handleApiResponse } from './api.service';

const ENDPOINTS = {
  JOBS: '/web/jobs',
  JOB: (id) => `/web/jobs/${id}`,
  JOB_APPLICATIONS: (id) => `/web/jobs/${id}/applications`,
  ALL_APPLICATIONS: '/web/jobs/applications',
  APPLICATION_STATUS: (id) => `/web/jobs/applications/${id}/status`,
};

const jobsService = {
  createJob: (data) => handleApiResponse(api.post(ENDPOINTS.JOBS, data)),
  getJobs: (params = {}) => handleApiResponse(api.get(ENDPOINTS.JOBS, { params })),
  updateJob: (id, data) => handleApiResponse(api.put(ENDPOINTS.JOB(id), data)),
  deleteJob: (id) => handleApiResponse(api.delete(ENDPOINTS.JOB(id))),
  getJobApplications: (jobId, params = {}) => handleApiResponse(api.get(ENDPOINTS.JOB_APPLICATIONS(jobId), { params })),
  getAllApplications: (params = {}) => handleApiResponse(api.get(ENDPOINTS.ALL_APPLICATIONS, { params })),
  updateApplicationStatus: (applicationId, status) => handleApiResponse(api.put(ENDPOINTS.APPLICATION_STATUS(applicationId), { status })),
};

export default jobsService;
