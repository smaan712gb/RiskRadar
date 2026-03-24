import { severityColor } from '@/lib/utils';

export default function AlertsPage() {
  // In production, this fetches from the API via server components
  const mockAlerts = [
    { id: '1', title: 'Compound Risk: Finance + Security — Score 87', severity: 'critical', status: 'new', subjectId: 'EMP-4821', domains: ['finance', 'security'], score: 87, time: '14 min ago' },
    { id: '2', title: 'Override Pattern: 5 overrides during supervisor absence', severity: 'high', status: 'under_review', subjectId: 'EMP-1293', domains: ['finance'], score: 72, time: '2h ago' },
    { id: '3', title: 'Risk Trajectory Alert: Score 45 → projected 78', severity: 'medium', status: 'new', subjectId: 'EMP-3847', domains: ['hr', 'communications'], score: 45, time: '5h ago' },
    { id: '4', title: 'After-hours data access: 2.3GB transferred', severity: 'high', status: 'new', subjectId: 'EMP-9012', domains: ['security'], score: 68, time: '6h ago' },
    { id: '5', title: 'Expense anomaly: Benford deviation detected', severity: 'medium', status: 'dismissed', subjectId: 'EMP-2156', domains: ['finance'], score: 38, time: '1d ago' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
        <div className="flex gap-2">
          <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option>All Severities</option>
            <option>Critical</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
          <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option>All Statuses</option>
            <option>New</option>
            <option>Under Review</option>
            <option>Confirmed</option>
            <option>Dismissed</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alert</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Domains</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {mockAlerts.map((alert) => (
              <tr key={alert.id} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${severityColor(alert.severity)}`}>
                    {alert.severity}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-md truncate">
                  {alert.title}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 font-mono">{alert.subjectId}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-1">
                    {alert.domains.map((d) => (
                      <span key={d} className="inline-flex items-center rounded px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600">
                        {d}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-sm font-bold ${alert.score >= 70 ? 'text-risk-critical' : alert.score >= 50 ? 'text-risk-high' : 'text-risk-medium'}`}>
                    {alert.score}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    alert.status === 'new' ? 'bg-blue-100 text-blue-700' :
                    alert.status === 'under_review' ? 'bg-yellow-100 text-yellow-700' :
                    alert.status === 'dismissed' ? 'bg-gray-100 text-gray-500' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {alert.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{alert.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
