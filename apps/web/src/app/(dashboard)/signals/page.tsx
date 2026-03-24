export default function SignalsPage() {
  const domainStats = [
    { domain: 'Finance', signals24h: 520, trend: '+8%', topType: 'override_transaction', topCount: 89 },
    { domain: 'Security', signals24h: 412, trend: '+12%', topType: 'after_hours_access', topCount: 67 },
    { domain: 'Operations', signals24h: 341, trend: '-3%', topType: 'productivity_decline', topCount: 54 },
    { domain: 'HR', signals24h: 289, trend: '+5%', topType: 'attendance_anomaly', topCount: 41 },
    { domain: 'Communications', signals24h: 285, trend: '+2%', topType: 'communication_drop', topCount: 38 },
    { domain: 'Compliance', signals24h: 124, trend: '+15%', topType: 'policy_violation', topCount: 22 },
    { domain: 'Customer', signals24h: 76, trend: '-7%', topType: 'customer_complaint_spike', topCount: 15 },
  ];

  const recentSignals = [
    { time: '14:23:07', domain: 'finance', type: 'override_transaction', subject: 'EMP-4821', value: '$52,000', source: 'Core Banking' },
    { time: '14:22:45', domain: 'security', type: 'after_hours_access', subject: 'EMP-9012', value: null, source: 'Azure AD' },
    { time: '14:21:30', domain: 'hr', type: 'training_missed', subject: 'EMP-3291', value: null, source: 'Workday' },
    { time: '14:20:15', domain: 'finance', type: 'expense_anomaly', subject: 'EMP-2156', value: '$1,500', source: 'SAP' },
    { time: '14:19:58', domain: 'operations', type: 'task_completion_drop', subject: 'EMP-5500', value: '-35%', source: 'Jira' },
    { time: '14:18:44', domain: 'communications', type: 'response_time_increase', subject: 'EMP-7744', value: '+180%', source: 'Slack' },
    { time: '14:17:22', domain: 'security', type: 'failed_login_spike', subject: 'SVC-API-03', value: '47', source: 'Splunk' },
    { time: '14:16:01', domain: 'compliance', type: 'policy_violation', subject: 'EMP-1293', value: null, source: 'RiskRadar' },
  ];

  const domainColors: Record<string, string> = {
    finance: 'bg-blue-100 text-blue-700',
    security: 'bg-red-100 text-red-700',
    operations: 'bg-purple-100 text-purple-700',
    hr: 'bg-green-100 text-green-700',
    communications: 'bg-yellow-100 text-yellow-700',
    compliance: 'bg-orange-100 text-orange-700',
    customer: 'bg-pink-100 text-pink-700',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Signals</h1>
        <div className="text-sm text-gray-500">
          <span className="font-bold text-gray-900">2,047</span> signals in last 24 hours
        </div>
      </div>

      {/* Domain Stats */}
      <div className="grid grid-cols-7 gap-3 mb-6">
        {domainStats.map((d) => (
          <div key={d.domain} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <div className="text-xs text-gray-500">{d.domain}</div>
            <div className="text-xl font-bold text-gray-900">{d.signals24h}</div>
            <div className={`text-xs ${d.trend.startsWith('+') ? 'text-red-500' : 'text-green-500'}`}>{d.trend}</div>
          </div>
        ))}
      </div>

      {/* Live Signal Feed */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <h2 className="font-semibold text-gray-900">Live Signal Feed</h2>
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
