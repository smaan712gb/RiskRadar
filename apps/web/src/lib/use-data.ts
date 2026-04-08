'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from './api-client';
import { useAuthStore } from './store';
import {
  DEMO_ALERTS,
  DEMO_CASES,
  DEMO_RISK_SCORES,
  DEMO_KPIS,
  DEMO_RISK_DISTRIBUTION,
  DEMO_SIGNAL_STATS,
  DEMO_POLICIES,
  DEMO_INTEGRATIONS,
  DEMO_AUDIT_LOGS,
  DEMO_AGENTS,
  TFCU_TENANT,
  IC3_THREAT_DATA,
  DEMO_VENDOR_RISKS,
} from './demo-data';

interface UseDataResult<T> {
  data: T;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  isDemo: boolean;
}

/**
 * Generic hook: tries API first, falls back to demo data.
 */
function useApiWithFallback<T>(
  apiFn: () => Promise<T>,
  fallback: T,
): UseDataResult<T> {
  const { token } = useAuthStore();
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (token) {
      api.setToken(token);
      try {
        const result = await apiFn();
        setData(result);
        setIsDemo(false);
        setLoading(false);
        return;
      } catch {
        // API unavailable — fall back to demo
      }
    }

    // Use demo data
    setData(fallback);
    setIsDemo(true);
    setLoading(false);
  }, [token, apiFn, fallback]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch, isDemo };
}

export function useAlerts() {
  return useApiWithFallback(
    () => api.getAlerts() as Promise<typeof DEMO_ALERTS>,
    DEMO_ALERTS,
  );
}

export function useAlert(id: string) {
  const alert = DEMO_ALERTS.find((a) => a.id === id) ?? DEMO_ALERTS[0]!;
  return useApiWithFallback(
    () => api.getAlert(id) as Promise<typeof alert>,
    alert,
  );
}

export function useCases() {
  return useApiWithFallback(
    () => api.getCases() as Promise<typeof DEMO_CASES>,
    DEMO_CASES,
  );
}

export function useRiskScores() {
  return useApiWithFallback(
    () => api.getRiskScores() as Promise<typeof DEMO_RISK_SCORES>,
    DEMO_RISK_SCORES,
  );
}

export function usePolicies() {
  return useApiWithFallback(
    () => api.getPolicies() as Promise<typeof DEMO_POLICIES>,
    DEMO_POLICIES,
  );
}

export function useIntegrations() {
  return useApiWithFallback(
    () => api.getIntegrations() as Promise<typeof DEMO_INTEGRATIONS>,
    DEMO_INTEGRATIONS,
  );
}

export function useAuditLogs() {
  return useApiWithFallback(
    () => api.getAuditLogs() as Promise<typeof DEMO_AUDIT_LOGS>,
    DEMO_AUDIT_LOGS,
  );
}

export function useOverviewKPIs() {
  return {
    kpis: DEMO_KPIS,
    riskDistribution: DEMO_RISK_DISTRIBUTION,
    signalStats: DEMO_SIGNAL_STATS,
    isDemo: true,
  };
}

export function useAgents() {
  return { data: DEMO_AGENTS, isDemo: true };
}

export function useTenant() {
  const { user } = useAuthStore();
  return {
    name: user?.tenantName ?? TFCU_TENANT.name,
    slug: user?.tenantSlug ?? TFCU_TENANT.slug,
  };
}

export function useIC3ThreatData() {
  return { data: IC3_THREAT_DATA, isDemo: true };
}

export function useVendorRisks() {
  return { data: DEMO_VENDOR_RISKS, isDemo: true };
}
