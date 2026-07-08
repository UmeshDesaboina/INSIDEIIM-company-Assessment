import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const searchCompanies = (query) => api.get(`/reports/search?query=${encodeURIComponent(query)}`);
export const generateReport = (symbol) => api.post('/reports/generate', { symbol });
export const getReport = (symbol) => api.get(`/reports/${symbol}`);
export const getReportPDF = (symbol) => api.get(`/reports/pdf/${symbol}`, { responseType: 'blob' });
export const toggleSaveReport = (symbol) => api.patch(`/reports/${symbol}/save`);
export const getSavedReports = () => api.get('/reports/saved');

export const getFavorites = () => api.get('/favorites');
export const addFavorite = (symbol, companyName) => api.post('/favorites', { symbol, companyName });
export const removeFavorite = (symbol) => api.delete(`/favorites/${symbol}`);

export const getHistory = (page = 1) => api.get(`/history?page=${page}`);
export const clearHistory = () => api.delete('/history');

export const sendChatMessage = (message, symbol) => api.post('/chat', { message, symbol });

export default api;
