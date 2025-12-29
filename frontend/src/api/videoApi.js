import axiosInstance from './axiosInstance';

export const videoApi = {
  /**
   * Uploads a video file to the backend
   * Note: Axios automatically sets the Content-Type to multipart/form-data 
   * when it detects a FormData object.
   */
  upload: async (file) => {
    const formData = new FormData();
    formData.append('video', file);

    const response = await axiosInstance.post('/video/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Trigger AI insights
  getInsights: async (videoId) => {
    const response = await axiosInstance.post(`/video/${videoId}/insights`);
    return response.data;
  }
};