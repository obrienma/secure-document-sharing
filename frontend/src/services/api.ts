import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface User {
  id: number;
  email: string;
  full_name: string;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

// Auth API
export const authAPI = {
  register: async (email: string, password: string, fullName: string) => {
    const { data } = await api.post<AuthResponse>('/api/auth/register', {
      email,
      password,
      fullName,
    });
    return data;
  },

  login: async (email: string, password: string) => {
    const { data } = await api.post<AuthResponse>('/api/auth/login', {
      email,
      password,
    });
    return data;
  },

  getMe: async () => {
    const { data } = await api.get<{ user: User }>('/api/auth/me');
    return data.user;
  },
};

export default api;
