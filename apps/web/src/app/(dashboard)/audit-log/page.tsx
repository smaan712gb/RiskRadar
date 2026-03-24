export default function AuditLogPage() {
  const logs = [
    { time: '14:23:07', actor: 'Fusion Agent', actorType: 'agent', action: 'alert.created', resource: 'Alert ALT-0847', details: 'Compound risk score 91, domains: finance+security' },
    { time: '14:22:45', actor: 'Alert Router', actorType: 'agent', action: 'alert.assigned', resource: 'Alert ALT-0847', details: 'Auto-assigned to Jane Analyst (load-balanced)' },
    { time: '14:20:12', actor: 'Jane Analyst', actorType: 'user', action: 'alert.status_changed', resource: 'Alert ALT-0847', details: 'new → under_review' },
    { time: '14:18:30', actor: 'Jane Analyst', actorType: 'user', action: 'alert.escalated', resource: 'Alert ALT-0847', details: 'Created Case CSE-001' },
    { time: '14:15:00', actor: 'Finance Collector', actorType: 'agent', action: 'agent.signal_ingested', resource: 'Signal batch B-4421', details: '23 signals from Core Banking API' },
    { time: '14:12:44', actor: 'Regulatory Watchdog', actorType: 'agent', action: 'agent.reasoning_completed', resource: 'Gap Analysis', details: 'Compliance posture: 73% across BSA/AML, SOX' },
    { time: '14:10:00', actor: 'Mike CCO', actorType: 'user', action: 'case.comment_added', resource: 'Case CSE-001', details: 'Internal comment: preserve evidence' },
    { time: '14:05:22', actor: 'System', actorType: 'system', action: 'policy.approved', resource: 'Policy POL-006', details: 'Expense Fraud Detection (Benford) v1 approved' },
    { time: '13:58:10', actor: 'Trajectory Engine', actorType: 'agent', action: 'alert.created', resource: 'Alert ALT-0843', details: 'Risk trajectory alert: EMP-3847 accelerating to 78' },
    { time: '13:45:00', actor: 'Admin', actorType: 'user', action: 'integration.synced', resource: 'Integration INT-003', details: 'Manual sync triggered for Workday HR' },
  ];

  const actorTypeColors: Record<string, string> = {
    agent: 'bg-purple-100 text-purple-700',
    user: 'bg-blue-100 text-blue-700',
    system: 'bg-gray-100 text-gray-700',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <div className="flex gap-2">
          <input type="date" className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <input type="date" className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option>All Actors</option>
            <option>Users</option>
            <option>Agents</option>
            <option>System</option>
          </select>
          <button className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-800">
            Export
          </button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 text-sm text-amber-800">
        Audit logs are immutable. All agent actions, data access, model inferences, and user interactions are permanently recorded.
        Records are retained per regulatory requirements (7 years for BSA/AML).
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
            {logs.map((log, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-6 py-3 text-xs font-mono text-gray-500 whitespace-nowrap">{log.time}</td>
                <td className="px-6 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${actorTypeColors[log.actorType]}`}>{log.actorType}</span>
                    <span className="text-sm text-gray-900">{log.actor}</span>
                  </div>
                </td>
                <td className="px-6 py-3 text-xs font-mono text-gray-700">{log.action}</td>
                <td className="px-6 py-3 text-sm text-blue-600">{log.resource}</td>
                <td className="px-6 py-3 text-xs text-gray-500 max-w-xs truncate">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
