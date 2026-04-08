'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { DEMO_USERS, TFCU_TENANT } from '@/lib/demo-data';

const DEMO_CREDENTIALS = [
  { label: 'VP Risk & Compliance', email: 'admin@tfcu.org', role: 'admin', name: 'Maria Gonzalez' },
  { label: 'Chief Compliance Officer', email: 'compliance@tfcu.org', role: 'compliance_officer', name: 'David Chen' },
  { label: 'CISO', email: 'ciso@tfcu.org', role: 'ciso', name: 'Raj Patel' },
  { label: 'Senior Risk Analyst', email: 'sarah.kim@tfcu.org', role: 'analyst', name: 'Sarah Kim' },
  { label: 'BSA/AML Analyst', email: 'james.wright@tfcu.org', role: 'analyst', name: 'James Wright' },
  { label: 'Branch Ops Manager', email: 'linda.thompson@tfcu.org', role: 'manager', name: 'Linda Thompson' },
  { label: 'Internal Auditor', email: 'auditor@tfcu.org', role: 'auditor', name: 'Robert Martinez' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantSlug, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message ?? 'Login failed');
        return;
      }

      login(data.data.accessToken, data.data.user);
      window.location.href = '/overview';
    } catch {
      setError('API not available. Use demo login below to explore the platform.');
    } finally {
      setLoading(false);
    }
  }

  function handleDemoLogin(cred: typeof DEMO_CREDENTIALS[0]) {
    const user = DEMO_USERS.find((u) => u.email === cred.email)!;
    login('demo-token-' + Date.now(), {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: TFCU_TENANT.id,
      tenantName: TFCU_TENANT.name,
      tenantSlug: TFCU_TENANT.slug,
    });
    window.location.href = '/overview';
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to RiskRadar</h2>
      <p className="text-gray-500 mb-8">Enter your credentials to access the dashboard</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Organization</label>
          <input
            type="text"
            value={tenantSlug}
            onChange={(e) => setTenantSlug(e.target.value)}
            placeholder="tfcu"
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">Your organization identifier</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@tfcu.org"
            required
            autoComplete="email"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <Link href="/forgot-password" className="text-xs text-blue-600 hover:text-blue-800">
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            autoComplete="current-password"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      {/* Demo Quick Login */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium uppercase">Demo Login — {TFCU_TENANT.name}</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>
        <div className="grid grid-cols-1 gap-2">
          {DEMO_CREDENTIALS.map((cred) => (
            <button
              key={cred.email}
              onClick={() => handleDemoLogin(cred)}
              className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm hover:bg-blue-50 hover:border-blue-200 transition-colors text-left"
            >
              <div>
                <span className="font-medium text-gray-900">{cred.name}</span>
                <span className="text-gray-400 mx-2">—</span>
                <span className="text-gray-500">{cred.label}</span>
              </div>
              <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">{cred.role}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 text-center mt-3">
          Click any role above to explore the platform as a {TFCU_TENANT.name} employee
        </p>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-blue-600 font-medium hover:text-blue-800">
            Start free trial
          </Link>
        </p>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-400 text-center">
          Self-hosted? <a href="https://github.com/smaan712gb/RiskRadar" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">Deploy on your own infrastructure</a>
        </p>
      </div>
    </div>
  );
}
