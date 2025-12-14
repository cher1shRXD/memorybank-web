import { createApiClient } from "@cher1shrxd/api-client";

export const apiClient = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL!,
  setupInterceptors: (instance) => {
    instance.interceptors.request.use((config) => {
      // Add ngrok headers if needed
      config.headers.set('ngrok-skip-browser-warning', 'true');
      
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.set('Authorization', `Bearer ${token}`);
        }
      }
      return config;
    });
    
    instance.interceptors.response.use(
      (response) => response,
      async (error) => {
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
    );
  }
});