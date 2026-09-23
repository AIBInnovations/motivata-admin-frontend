import { api, handleApiResponse } from './api.service';

const occupationService = {
  list: () => handleApiResponse(api.get('/web/occupations', { params: { all: true } })),
  create: (data) => handleApiResponse(api.post('/web/occupations', data)),
  update: (id, data) => handleApiResponse(api.put(`/web/occupations/${id}`, data)),
  remove: (id) => handleApiResponse(api.delete(`/web/occupations/${id}`)),
};

export default occupationService;
