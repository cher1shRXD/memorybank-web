export interface GoogleAuthRequest {
  id_token: string;
}

export interface EmailRegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface EmailLoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface AccessTokenResponse {
  access_token: string;
}