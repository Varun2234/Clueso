// frontend/src/api/axiosInstance.js
import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

const axiosInstance = axios.create({
  // Ensure this matches your backend PORT
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 60000,
});

axiosInstance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  config.headers = config.headers || {};
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Robust multipart handling
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  } else {
    config.headers['Content-Type'] = 'application/json';
  }

  return config;
});

export default axiosInstance;