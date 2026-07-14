import axios from 'axios';

// URL actualizada apuntando a tu propio backend
const API_URL = import.meta.env.VITE_API_URL || 'https://api.coronel.byronrm.com';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token a cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const authAPI = {
  register: (email, password) =>
    api.post('/auth/register', { email, password }),
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
};

// Tasks
export const tasksAPI = {
  getAll: () => api.get('/tasks'),
  create: (title, description) =>
    api.post('/tasks', { title, description }),
  update: (id, data) =>
    api.put(`/tasks/${id}`, data),
  delete: (id) =>
    api.delete(`/tasks/${id}`),
};

export default api;