import { createApiClient } from "@cher1shrxd/api-client";

export const apiClient = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL!,
  withCredentials: false,
  interceptors: {
    onRequest: (config) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    },
    onRequestError: (error) => {
      return Promise.reject(error);
    },
    onResponse: (response) => {
      return response;
    },
    onResponseError: async (error) => {
      if (error.response?.status === 401) {
        // Handle unauthorized access
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  }
});