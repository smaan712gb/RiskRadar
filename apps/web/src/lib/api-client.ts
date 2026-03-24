import type { ApiResponse, ApiError } from '@riskradar/shared';

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/api/v1';

class ApiClient {
  private token: string | null = null;

  setToken(token: string): void {
    this.token = token;
  }

  clearToken(): void {
    this.token = null;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, string>,
  ): Promise<T> {
    const url = new URL(`${API_BASE}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) url.searchParams.set(key, value);
      });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url.toString(), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as ApiError;
      throw new Error(error.error?.message ?? `API error: ${response.status}`);
    }

    return (data as ApiResponse<T>).data;
  }

  // Alerts
  getAlerts(params?: Record<string, string>) { return this.request<unknown[]>('GET', '/alerts', undefined, params); }
  getAlert(id: string) { return this.request<unknown>('GET', `/alerts/${id}`); }
  updateAlertStatus(id: string, body: unknown) { return this.request<unknown>('PATCH', `/alerts/${id}/status`, body); }
  escalateAlert(id: string) { return this.request<unknown>('POST', `/alerts/${id}/escalate`); }
  getAlertStats() { return this.request<unknown>('GET', '/alerts/stats'); }

  // Cases
  getCases(params?: Record<string, string>) { return this.request<unknown[]>('GET', '/cases', undefined, params); }
  getCase(id: string) { return this.request<unknown>('GET', `/cases/${id}`); }
  createCase(body: unknown) { return this.request<unknown>('POST', '/cases', body); }
  updateCase(id: string, body: unknown) { return this.request<unknown>('PATCH', `/cases/${id}`, body); }
  addCaseComment(id: string, body: unknown) { return this.request<unknown>('POST', `/cases/${id}/comments`, body); }

  // Signals
  getSignals(params?: Record<string, string>) { return this.request<unknown[]>('GET', '/signals', undefined, params); }
  getSignalStats(params?: Record<string, string>) { return this.request<unknown>('GET', '/signals/stats', undefined, params); }
  ingestSignals(body: unknown) { return this.request<unknown>('POST', '/signals/ingest', body); }

  // Risk Scores
  getRiskScores(params?: Record<string, string>) { return this.request<unknown[]>('GET', '/risk-scores', undefined, params); }
  getRiskProfile(subjectId: string) { return this.request<unknown>('GET', `/risk-scores/${subjectId}`); }
  getRiskHeatmap() { return this.request<unknown>('GET', '/risk-scores/heatmap'); }

  // Policies
  getPolicies(params?: Record<string, string>) { return this.request<unknown[]>('GET', '/policies', undefined, params); }
  getPolicy(id: string) { return this.request<unknown>('GET', `/policies/${id}`); }
  createPolicy(body: unknown) { return this.request<unknown>('POST', '/policies', body); }
  approvePolicy(id: string) { return this.request<unknown>('POST', `/policies/${id}/approve`); }

  // Integrations
  getIntegrations(params?: Record<string, string>) { return this.request<unknown[]>('GET', '/integrations', undefined, params); }
  testIntegration(id: string) { return this.request<unknown>('POST', `/integrations/${id}/test`); }
  syncIntegration(id: string) { return this.request<unknown>('POST', `/integrations/${id}/sync`); }

  // Audit Logs
  getAuditLogs(params?: Record<string, string>) { return this.request<unknown[]>('GET', '/audit-logs', undefined, params); }

  // Auth
  login(body: { tenantSlug: string; email: string; password: string }) {
    return this.request<{ accessToken: string; user: unknown }>('POST', '/auth/login', body);
  }
}

export const api = new ApiClient();
