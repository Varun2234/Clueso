import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

const axiosInstance = axios.create({
  // Ensure this matches your backend PORT
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout:60000,
});

axiosInstance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  config.headers = config.headers || {};
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // If sending FormData, let the browser set the Content-Type (with boundary)
  try {
    if (config && config.data && typeof FormData !== 'undefined' && config.data instanceof FormData) {
      if (config.headers) delete config.headers['Content-Type'];
    } else {
      config.headers['Content-Type'] = config.headers['Content-Type'] || 'application/json';
    }
  } catch (e) {
    // silently continue for environments where FormData isn't present
  }

  return config;
});

export default axiosInstance;