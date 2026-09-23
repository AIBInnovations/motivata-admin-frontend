import { api, handleApiResponse } from './api.service';

const communityService = {
  getWeeklyUpdates: (params = {}) => handleApiResponse(api.get('/web/community/weekly-updates', { params })),
  deleteWeeklyUpdate: (id) => handleApiResponse(api.delete(`/web/community/weekly-updates/${id}`)),
  getHelpRequests: (params = {}) => handleApiResponse(api.get('/web/community/help-requests', { params })),
  resolveHelpRequest: (id) => handleApiResponse(api.post(`/web/community/help-requests/${id}/resolve`)),
  deleteHelpRequest: (id) => handleApiResponse(api.delete(`/web/community/help-requests/${id}`)),
};

export default communityService;
