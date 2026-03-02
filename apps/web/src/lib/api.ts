// =====================================================
// API Client for Web Dashboard
// =====================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private tenantId: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('accessToken');
      this.tenantId = localStorage.getItem('tenantId');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('accessToken', token);
      } else {
        localStorage.removeItem('accessToken');
      }
    }
  }

  setTenantId(tenantId: string | null) {
    this.tenantId = tenantId;
    if (typeof window !== 'undefined') {
      if (tenantId) {
        localStorage.setItem('tenantId', tenantId);
      } else {
        localStorage.removeItem('tenantId');
      }
    }
  }

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    if (this.tenantId) {
      headers['x-tenant-id'] = this.tenantId;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.setToken(null);
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string) {
    return this.request<{ data: { accessToken: string; refreshToken: string } }>('/v1/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  }

  // Users
  async getUsers(params?: { page?: number; limit?: number; search?: string }) {
    const query = new URLSearchParams();
    if (params?.page != null) query.set('page', String(params.page));
    if (params?.limit != null) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    return this.request<{ data: unknown[] }>(`/v1/users?${query.toString()}`);
  }

  async getUser(id: string) {
    return this.request<{ data: unknown }>(`/v1/users/${id}`);
  }

  // Transactions
  async getTransactions(params?: { page?: number; limit?: number; category?: string }) {
    const query = new URLSearchParams();
    if (params?.page != null) query.set('page', String(params.page));
    if (params?.limit != null) query.set('limit', String(params.limit));
    if (params?.category) query.set('category', params.category);
    return this.request<{ data: unknown[] }>(`/v1/transactions?${query.toString()}`);
  }

  async getTransaction(id: string) {
    return this.request<{ data: unknown }>(`/v1/transactions/${id}`);
  }

  // Cards
  async getCards() {
    return this.request<{ data: unknown[] }>('/v1/cards');
  }

  // Rewards
  async getRewards() {
    return this.request<{ data: unknown }>('/v1/rewards/summary');
  }

  async getRecommendations() {
    return this.request<{ data: unknown[] }>('/v1/recommendations');
  }

  // Compliance
  async getComplianceAlerts(params?: { status?: string }) {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    return this.request<{ data: unknown[] }>(`/v1/compliance/alerts?${query.toString()}`);
  }

  async resolveComplianceAlert(id: string, resolution: string) {
    return this.request(`/v1/compliance/alerts/${id}/resolve`, {
      method: 'PUT',
      body: { resolution },
    });
  }

  // Audit
  async getAuditLogs(params?: { page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.page != null) query.set('page', String(params.page));
    if (params?.limit != null) query.set('limit', String(params.limit));
    return this.request<{ data: unknown[] }>(`/v1/audit?${query.toString()}`);
  }

  // Tenants
  async getTenants() {
    return this.request<{ data: unknown[] }>('/v1/tenants');
  }

  async getTenant(id: string) {
    return this.request<{ data: unknown }>(`/v1/tenants/${id}`);
  }

  async updateTenant(id: string, data: unknown) {
    return this.request(`/v1/tenants/${id}`, { method: 'PUT', body: data });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
