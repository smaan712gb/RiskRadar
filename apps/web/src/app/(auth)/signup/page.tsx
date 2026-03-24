'use client';

import { useState } from 'react';
import Link from 'next/link';

const industries = [
  { value: 'banking', label: 'Banking' },
  { value: 'credit_union', label: 'Credit Union' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'technology', label: 'Technology' },
  { value: 'retail', label: 'Retail' },
  { value: 'government', label: 'Government' },
  { value: 'other', label: 'Other' },
];

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    orgName: '',
    industry: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function updateForm(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (step === 1) {
      if (!form.orgName || !form.industry) {
        setError('Please fill in all fields');
        return;
      }
      setStep(2);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const slug = form.orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantName: form.orgName,
          tenantSlug: slug,
          industry: form.industry,
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message ?? 'Registration failed');
        return;
      }

      localStorage.setItem('riskradar_token', data.data.accessToken);
      localStorage.setItem('riskradar_user', JSON.stringify(data.data.user));
      window.location.href = '/onboarding';
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Create your account</h2>
      <p className="text-gray-500 mb-8">14-day free trial. No credit card required.</p>

      {/* Step Indicator */}
      <div className="flex items-center gap-3 mb-8">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
        <div className={`flex-1 h-0.5 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {step === 1 && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Organization Name</label>
              <input type="text" value={form.orgName} onChange={(e) => updateForm('orgName', e.target.value)} placeholder="Acme Community Bank" required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Industry</label>
              <select value={form.industry} onChange={(e) => updateForm('industry', e.target.value)} required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
                <option value="">Select your industry</option>
                {industries.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
              </select>
              <p className="text-xs text-gray-400 mt-1">This helps us pre-configure regulatory frameworks</p>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Name</label>
              <input type="text" value={form.name} onChange={(e) => updateForm('name', e.target.value)} placeholder="Jane Smith" required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Work Email</label>
              <input type="email" value={form.email} onChange={(e) => updateForm('email', e.target.value)} placeholder="jane@acmebank.com" required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input type="password" value={form.password} onChange={(e) => updateForm('password', e.target.value)} placeholder="Minimum 8 characters" required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
              <input type="password" value={form.confirmPassword} onChange={(e) => updateForm('confirmPassword', e.target.value)} placeholder="Confirm your password" required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </>
        )}

        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {loading ? 'Creating account...' : step === 1 ? 'Continue' : 'Create Account & Start Trial'}
        </button>

        {step === 2 && (
          <button type="button" onClick={() => setStep(1)} className="w-full bg-gray-100 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200">
            Back
          </button>
        )}
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account? <Link href="/login" className="text-blue-600 font-medium hover:text-blue-800">Sign in</Link>
      </p>

      <p className="mt-4 text-xs text-gray-400 text-center">
        By creating an account, you agree to our <a href="/terms" className="underline">Terms of Service</a> and <a href="/privacy" className="underline">Privacy Policy</a>.
      </p>
    </div>
  );
}
