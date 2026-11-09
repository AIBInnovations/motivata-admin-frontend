import { api, handleApiResponse } from './api.service';

const pushNotificationService = {
  countAudience: (params = {}) => handleApiResponse(api.get('/web/push-notifications/audience', { params })),
  send: (payload) => handleApiResponse(api.post('/web/push-notifications/send', payload)),
};

export default pushNotificationService;
