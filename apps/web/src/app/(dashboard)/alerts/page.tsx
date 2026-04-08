'use client';

import Link from 'next/link';
import { severityColor } from '@/lib/utils';
import { useAlerts } from '@/lib/use-data';

export default function AlertsPage() {
  const { data: alerts, isDemo } = useAlerts();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
          {isDemo && <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full ml-2">Demo Data</span>}
        </div>
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
            {alerts.map((alert) => (
              <tr key={alert.id} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${severityColor(alert.severity)}`}>
                    {alert.severity}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-md">
                  <Link href={`/alerts/${alert.id}`} className="hover:text-blue-600 block truncate">
                    {alert.title}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-mono text-gray-600">{alert.subjectId}</div>
                  {'subjectName' in alert && <div className="text-xs text-gray-400 truncate max-w-[160px]">{(alert as Record<string, unknown>).subjectName as string}</div>}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-1 flex-wrap">
                    {alert.domains.map((d) => (
                      <span key={d} className="inline-flex items-center rounded px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600">
                        {d}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-sm font-bold ${alert.compoundScore >= 70 ? 'text-risk-critical' : alert.compoundScore >= 50 ? 'text-risk-high' : 'text-risk-medium'}`}>
                    {alert.compoundScore}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    alert.status === 'new' ? 'bg-blue-100 text-blue-700' :
                    alert.status === 'under_review' ? 'bg-yellow-100 text-yellow-700' :
                    alert.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                    alert.status === 'dismissed' ? 'bg-gray-100 text-gray-500' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {alert.status.replace(/_/g, ' ')}
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
