import { api, handleApiResponse } from './api.service';

const ENDPOINTS = {
  POSTS: '/web/connect/posts',
  POST_BY_ID: (id) => `/web/connect/posts/${id}`,
};

const explorePostsService = {
  createPost: (data) =>
    handleApiResponse(api.post(ENDPOINTS.POSTS, data)),

  getPosts: (params = {}) =>
    handleApiResponse(api.get(ENDPOINTS.POSTS, { params })),

  deletePost: (postId) =>
    handleApiResponse(api.delete(ENDPOINTS.POST_BY_ID(postId))),
};

export default explorePostsService;
