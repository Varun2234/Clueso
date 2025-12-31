import axiosInstance from './axiosInstance';

export const feedbackApi = {
  // Pass page number to API
  getAll: async (page = 1) => {
    const response = await axiosInstance.get(`/feedback?page=${page}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await axiosInstance.get(`/feedback/${id}`);
    return response.data;
  },

  create: async (feedbackData) => {
    const response = await axiosInstance.post('/feedback', feedbackData);
    return response.data;
  },

  // New delete method
  delete: async (id) => {
    const response = await axiosInstance.delete(`/feedback/${id}`);
    return response.data;
  }
};