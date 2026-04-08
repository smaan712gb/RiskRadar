'use client';

import { useAuditLogs } from '@/lib/use-data';

const actorTypeColors: Record<string, string> = {
  agent: 'bg-purple-100 text-purple-700',
  user: 'bg-blue-100 text-blue-700',
  system: 'bg-gray-100 text-gray-700',
};

function getActorType(actor: string): string {
  if (actor.startsWith('System')) return 'system';
  if (['Fusion Engine', 'Alert Router', 'SAR Generator', 'Regulatory Watchdog', 'Trajectory Engine'].some((a) => actor.includes(a))) return 'agent';
  return 'user';
}

export default function AuditLogPage() {
  const { data: logs, isDemo } = useAuditLogs();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
          {isDemo && <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full ml-2">Demo Data</span>}
        </div>
        <div className="flex gap-2">
          <input type="date" className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <input type="date" className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option>All Actors</option>
            <option>Users</option>
            <option>Agents</option>
            <option>System</option>
          </select>
          <a href="/reports?type=audit" className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-800">
            Export Report
          </a>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 text-sm text-amber-800">
        Audit logs are immutable. All agent actions, data access, model inferences, and user interactions are permanently recorded.
        Records are retained per NCUA regulatory requirements (7 years for BSA/AML).
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resource</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((log) => {
              const actorType = getActorType(log.actor);
              return (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-xs font-mono text-gray-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${actorTypeColors[actorType]}`}>{actorType}</span>
                      <span className="text-sm text-gray-900">{log.actor}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-xs font-mono text-gray-700">{log.action}</td>
                  <td className="px-6 py-3 text-sm text-blue-600">{log.resource}</td>
                  <td className="px-6 py-3 text-xs text-gray-500 max-w-xs truncate">{log.details}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
