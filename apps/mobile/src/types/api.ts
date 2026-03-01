// =====================================================
// API Response Types
// =====================================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    cursor?: string | null;
    hasMore?: boolean;
    total?: number;
  };
}

export interface ApiError {
  type: string;
  title: string;
  status: number;
  detail: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface PaginationParams {
  limit?: number;
  cursor?: string;
}
