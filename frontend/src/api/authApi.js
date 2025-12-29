import axiosInstance from './axiosInstance';

export const authApi = {
  // Logic for Login
  login: async (credentials) => {
    const response = await axiosInstance.post('/auth/login', credentials);
    return response.data; // Should return { user, token }
  },

  // Logic for Signup
  signup: async (userData) => {
    const response = await axiosInstance.post('/auth/signup', userData);
    return response.data;
  },

  /**
   * getMe: Verifies the token on page refresh
   * This is used in a useEffect in App.jsx to keep the user logged in
   */
  getMe: async () => {
    const response = await axiosInstance.get('/auth/me');
    return response.data;
  }
};