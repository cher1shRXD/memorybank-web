import { apiClient } from './api-client';
import { 
  EmailLoginRequest, 
  EmailRegisterRequest, 
  GoogleAuthRequest, 
  TokenResponse,
  AccessTokenResponse,
  RefreshTokenRequest
} from '@/types/auth';

export const authApi = {
  register: async (data: EmailRegisterRequest) => {
    const response = await apiClient.post<TokenResponse>('/auth/register', data);
    return response.data;
  },

  login: async (data: EmailLoginRequest) => {
    const response = await apiClient.post<TokenResponse>('/auth/login', data);
    return response.data;
  },

  googleAuth: async (data: GoogleAuthRequest) => {
    const response = await apiClient.post<TokenResponse>('/auth/google', data);
    return response.data;
  },

  refreshToken: async (data: RefreshTokenRequest) => {
    const response = await apiClient.post<AccessTokenResponse>('/auth/refresh', data);
    return response.data;
  }
};

// Authorization is now handled by api-client interceptors
// These functions are kept for backward compatibility but do nothing
export const setAuthToken = () => {
  // No-op: Token is read from localStorage by interceptor
};

export const clearAuthToken = () => {
  // No-op: Token is removed from localStorage when clearing tokens
};

export const saveTokens = (tokens: TokenResponse) => {
  localStorage.setItem('access_token', tokens.access_token);
  localStorage.setItem('refresh_token', tokens.refresh_token);
  localStorage.setItem('user', JSON.stringify(tokens.user));
  setAuthToken();
};

export const getStoredTokens = () => {
  const accessToken = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');
  const userStr = localStorage.getItem('user');
  
  if (!accessToken || !refreshToken || !userStr) {
    return null;
  }

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    user: JSON.parse(userStr)
  };
};

export const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  clearAuthToken();
};