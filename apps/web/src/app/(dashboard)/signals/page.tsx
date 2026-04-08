export default function SignalsPage() {
  const domainStats = [
    { domain: 'Finance', signals24h: 520, trend: '+8%', topType: 'override_transaction', topCount: 89 },
    { domain: 'Security', signals24h: 412, trend: '+12%', topType: 'after_hours_access', topCount: 67 },
    { domain: 'Operations', signals24h: 341, trend: '-3%', topType: 'productivity_decline', topCount: 54 },
    { domain: 'HR', signals24h: 289, trend: '+5%', topType: 'attendance_anomaly', topCount: 41 },
    { domain: 'Communications', signals24h: 285, trend: '+2%', topType: 'communication_drop', topCount: 38 },
    { domain: 'Compliance', signals24h: 124, trend: '+15%', topType: 'policy_violation', topCount: 22 },
    { domain: 'Customer', signals24h: 76, trend: '-7%', topType: 'customer_complaint_spike', topCount: 15 },
    { domain: 'Crypto', signals24h: 214, trend: '+45%', topType: 'crypto_transfer_escalation', topCount: 34 },
    { domain: 'BEC', signals24h: 186, trend: '+28%', topType: 'writing_style_deviation', topCount: 29 },
    { domain: 'Ransomware', signals24h: 192, trend: '+22%', topType: 'cve_exploit_match', topCount: 41 },
    { domain: 'Vendor Risk', signals24h: 156, trend: '+18%', topType: 'vendor_rating_change', topCount: 12 },
    { domain: 'AI Threat', signals24h: 98, trend: 'NEW', topType: 'ai_phishing_detected', topCount: 47 },
  ];

  const recentSignals = [
    { time: '14:23:07', domain: 'bec', type: 'writing_style_deviation', subject: 'CFO-ACCT', value: '94%', source: 'M365 Email Analytics' },
    { time: '14:22:45', domain: 'crypto', type: 'high_risk_wallet', subject: 'MBR-9923', value: '91/100', source: 'Chainalysis KYT' },
    { time: '14:22:30', domain: 'ai_threat', type: 'ai_phishing_detected', subject: 'CAMP-0012', value: '47 emails', source: 'AI Threat Intel' },
    { time: '14:21:58', domain: 'ransomware', type: 'cve_exploit_match', subject: 'INFRA-SURFACE', value: 'CVE-2026-1234', source: 'MITRE ATT&CK' },
    { time: '14:21:30', domain: 'finance', type: 'override_transaction', subject: 'EMP-4821', value: '$52,000', source: 'Core Banking' },
    { time: '14:20:45', domain: 'vendor_risk', type: 'vendor_rating_change', subject: 'VND-ACME-PAY', value: 'A→C', source: 'SecurityScorecard' },
    { time: '14:20:15', domain: 'bec', type: 'vendor_payment_change', subject: 'VND-ACME', value: 'New bank details', source: 'Workday Financials' },
    { time: '14:19:58', domain: 'security', type: 'after_hours_access', subject: 'EMP-9012', value: null, source: 'Azure AD' },
    { time: '14:19:30', domain: 'crypto', type: 'crypto_transfer_escalation', subject: 'MBR-9923', value: '$120,000', source: 'Symitar + Chainalysis' },
    { time: '14:18:44', domain: 'hr', type: 'training_missed', subject: 'EMP-3291', value: null, source: 'UKG Pro' },
    { time: '14:17:22', domain: 'ransomware', type: 'exposed_rdp_service', subject: 'SRV-BRANCH-02', value: 'Port 3389', source: 'Attack Surface Scan' },
    { time: '14:16:01', domain: 'ai_threat', type: 'deepfake_tool_detected', subject: 'OSINT-FEED', value: 'New toolkit', source: 'AI Threat OSINT' },
  ];

  const domainColors: Record<string, string> = {
    finance: 'bg-blue-100 text-blue-700',
    security: 'bg-red-100 text-red-700',
    operations: 'bg-purple-100 text-purple-700',
    hr: 'bg-green-100 text-green-700',
    communications: 'bg-yellow-100 text-yellow-700',
    compliance: 'bg-orange-100 text-orange-700',
    customer: 'bg-pink-100 text-pink-700',
    crypto: 'bg-amber-100 text-amber-700',
    bec: 'bg-rose-100 text-rose-700',
    ransomware: 'bg-red-100 text-red-800',
    vendor_risk: 'bg-indigo-100 text-indigo-700',
    ai_threat: 'bg-violet-100 text-violet-700',
  };

  const totalSignals = domainStats.reduce((sum, d) => sum + d.signals24h, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Signals</h1>
        <div className="text-sm text-gray-500">
          <span className="font-bold text-gray-900">{totalSignals.toLocaleString()}</span> signals in last 24 hours
          <span className="ml-2 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">12 domains</span>
        </div>
      </div>

      {/* Domain Stats — two rows */}
      <div className="grid grid-cols-6 gap-3 mb-6">
        {domainStats.map((d) => (
          <div key={d.domain} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <div className="text-xs text-gray-500">{d.domain}</div>
            <div className="text-xl font-bold text-gray-900">{d.signals24h}</div>
            <div className={`text-xs ${d.trend === 'NEW' ? 'text-purple-600 font-medium' : d.trend.startsWith('+') ? 'text-red-500' : 'text-green-500'}`}>{d.trend}</div>
            <div className="text-[10px] text-gray-400 mt-1 truncate" title={d.topType}>{d.topType}</div>
          </div>
        ))}
      </div>

      {/* Live Signal Feed */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <h2 className="font-semibold text-gray-900">Live Signal Feed</h2>
          <span className="text-xs text-gray-400 ml-2">Including IC3 2025 threat domains</span>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
              <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Domain</th>
              <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Signal Type</th>
              <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
              <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
              <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {recentSignals.map((s, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-6 py-3 text-xs font-mono text-gray-500">{s.time}</td>
                <td className="px-6 py-3">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${domainColors[s.domain] ?? 'bg-gray-100'}`}>{s.domain}</span>
                </td>
                <td className="px-6 py-3 text-xs font-mono text-gray-700">{s.type}</td>
                <td className="px-6 py-3 text-xs font-mono text-blue-600">{s.subject}</td>
                <td className="px-6 py-3 text-xs font-medium text-gray-900">{s.value ?? '-'}</td>
                <td className="px-6 py-3 text-xs text-gray-500">{s.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
