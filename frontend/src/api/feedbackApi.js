import axiosInstance from './axiosInstance';

export const feedbackApi = {
  // Fetch all feedback for the dashboard
  getAll: async () => {
    const response = await axiosInstance.get('/feedback');
    return response.data;
  },

  // Fetch a single record for the FeedbackDetail page
  getById: async (id) => {
    const response = await axiosInstance.get(`/feedback/${id}`);
    return response.data;
  },

  // Create a new collection (Feedback + AI insights)
  create: async (feedbackData) => {
    const response = await axiosInstance.post('/feedback', feedbackData);
    return response.data;
  }
};