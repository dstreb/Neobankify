import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import Constants from 'expo-constants';
import { getAccessToken, getRefreshToken, setAccessToken, setRefreshToken, getTenantId, clearAllTokens } from '../utils/storage';

// =====================================================
// API Client with Auth Interceptors
// =====================================================

const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:3000';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}> = [];

function processQueue(error: AxiosError | null, token: string | null = null) {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
}

function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor: attach auth token and tenant ID
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const token = await getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      const tenantId = await getTenantId();
      if (tenantId) {
        config.headers['x-tenant-id'] = tenantId;
      }

      return config;
    },
    (error) => Promise.reject(error),
  );

  // Response interceptor: handle 401 with token refresh
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config;

      if (!originalRequest || error.response?.status !== 401) {
        return Promise.reject(error);
      }

      // Prevent refresh loop if refresh itself fails
      if (originalRequest.url?.includes('/auth/refresh')) {
        await clearAllTokens();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return client(originalRequest);
        });
      }

      // Prevent infinite retry loop: only retry once after refresh
      if ((originalRequest as Record<string, unknown>)._retry) {
        await clearAllTokens();
        return Promise.reject(error);
      }
      (originalRequest as Record<string, unknown>)._retry = true;

      isRefreshing = true;

      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const tenantId = await getTenantId();
        const response = await axios.post(`${API_BASE_URL}/v1/auth/refresh`, {
          refreshToken,
        }, {
          headers: {
            'x-tenant-id': tenantId || '',
          },
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        await setAccessToken(accessToken);
        await setRefreshToken(newRefreshToken);

        processQueue(null, accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return client(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError);
        await clearAllTokens();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    },
  );

  return client;
}

export const apiClient = createApiClient();
export default apiClient;
