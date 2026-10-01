import { create } from 'zustand';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Initialize auth from localStorage
  initialize: () => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('authUser');

    if (storedToken && storedUser) {
      set({
        token: storedToken,
        user: JSON.parse(storedUser),
        isAuthenticated: true,
      });
    }
  },

  // Register
  register: async (email, password, name, phone) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        email,
        password,
        name,
        phone,
      });

      const { token, user } = response.data;

      localStorage.setItem('authToken', token);
      localStorage.setItem('authUser', JSON.stringify(user));

      set({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      return { success: true, user };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Registration failed';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Login
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      const { token, user } = response.data;

      localStorage.setItem('authToken', token);
      localStorage.setItem('authUser', JSON.stringify(user));

      set({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      return { success: true, user };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Get current user
  fetchUser: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        set({ isLoading: false });
        return null;
      }

      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      set({ user: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      set({ user: null, token: null, isAuthenticated: false, error: 'Session expired', isLoading: false });
      return null;
    }
  },

  // Update profile
  updateProfile: async (name, phone) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.put(`${API_URL}/auth/profile`, { name, phone }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      set({ user: response.data, isLoading: false });
      localStorage.setItem('authUser', JSON.stringify(response.data));

      return { success: true, user: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Update failed';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },

  // Get auth header
  getAuthHeader: () => {
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
}));
