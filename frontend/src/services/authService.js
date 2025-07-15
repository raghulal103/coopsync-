import { apiClient } from './apiClient';

export const authService = {
  login: async (email, password, rememberMe = false) => {
    const response = await apiClient.post('/auth/login', {
      email,
      password,
      rememberMe
    });
    return response.data;
  },

  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  getProfile: async () => {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },

  refreshToken: async (refreshToken) => {
    const response = await apiClient.post('/auth/refresh', {
      refreshToken
    });
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await apiClient.post('/auth/forgot-password', {
      email
    });
    return response.data;
  },

  resetPassword: async (token, password) => {
    const response = await apiClient.post('/auth/reset-password', {
      token,
      password
    });
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  },

  verifyEmail: async (token) => {
    const response = await apiClient.post('/auth/verify-email', {
      token
    });
    return response.data;
  },

  resendVerification: async (email) => {
    const response = await apiClient.post('/auth/resend-verification', {
      email
    });
    return response.data;
  },

  setupMFA: async () => {
    const response = await apiClient.post('/auth/mfa/setup');
    return response.data;
  },

  verifyMFA: async (token) => {
    const response = await apiClient.post('/auth/mfa/verify', {
      token
    });
    return response.data;
  },

  disableMFA: async (password) => {
    const response = await apiClient.post('/auth/mfa/disable', {
      password
    });
    return response.data;
  }
};