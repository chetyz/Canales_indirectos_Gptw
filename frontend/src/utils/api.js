import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response } = error;
    
    if (response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
      toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    } else if (response?.status === 403) {
      toast.error('No tienes permisos para realizar esta acción.');
    } else if (response?.status >= 500) {
      toast.error('Error del servidor. Por favor, inténtalo más tarde.');
    } else if (response?.data?.message) {
      toast.error(response.data.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;