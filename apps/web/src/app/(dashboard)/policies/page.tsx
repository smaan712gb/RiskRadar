export default function PoliciesPage() {
  const policies = [
    { id: 'POL-001', name: 'Transaction Override Monitoring', domain: 'finance', type: 'monitoring_rule', status: 'active', approved: true, version: 3, regRef: 'BSA/AML 31 CFR 1020.320', nlInput: null },
    { id: 'POL-002', name: 'After-Hours Access Detection', domain: 'security', type: 'monitoring_rule', status: 'active', approved: true, version: 2, regRef: 'NIST CSF PR.AC', nlInput: null },
    { id: 'POL-003', name: 'Employee Attrition Risk', domain: 'hr', type: 'alert_threshold', status: 'active', approved: true, version: 1, regRef: null, nlInput: 'Alert when employee communication drops >30% and productivity declines >20% over 4 weeks' },
    { id: 'POL-004', name: 'Structuring Detection (<$10K)', domain: 'finance', type: 'monitoring_rule', status: 'active', approved: true, version: 4, regRef: 'BSA/AML CTR Requirements', nlInput: null },
    { id: 'POL-005', name: 'Data Exfiltration Prevention', domain: 'security', type: 'monitoring_rule', status: 'active', approved: true, version: 2, regRef: 'NIST SP 800-53 AC-4', nlInput: null },
    { id: 'POL-006', name: 'Expense Fraud Detection (Benford)', domain: 'finance', type: 'monitoring_rule', status: 'pending', approved: false, version: 1, regRef: 'SOX Section 404', nlInput: 'Flag expense reports where amounts deviate from Benfords Law distribution or are submitted on weekends' },
    { id: 'POL-007', name: 'SLA Breach Prediction', domain: 'operations', type: 'alert_threshold', status: 'active', approved: true, version: 1, regRef: null, nlInput: null },
    { id: 'POL-008', name: 'Regulatory Change Alert', domain: 'compliance', type: 'escalation_workflow', status: 'active', approved: true, version: 1, regRef: 'Multiple', nlInput: null },
  ];

  const domainColors: Record<string, string> = {
    finance: 'bg-blue-100 text-blue-700',
    security: 'bg-red-100 text-red-700',
    hr: 'bg-green-100 text-green-700',
    operations: 'bg-purple-100 text-purple-700',
    compliance: 'bg-orange-100 text-orange-700',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Monitoring Policies</h1>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
            Create from Natural Language
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            Create Policy
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 uppercase">Active Policies</div>
          <div className="text-2xl font-bold text-gray-900">{policies.filter((p) => p.status === 'active').length}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 uppercase">Pending Approval</div>
          <div className="text-2xl font-bold text-yellow-600">{policies.filter((p) => !p.approved).length}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 uppercase">NL-Generated</div>
          <div className="text-2xl font-bold text-purple-600">{policies.filter((p) => p.nlInput).length}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 uppercase">Regulatory-Linked</div>
          <div className="text-2xl font-bold text-blue-600">{policies.filter((p) => p.regRef).length}</div>
        </div>
      </div>

      {/* Policy Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Policy</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Domain</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Version</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Regulatory Ref</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {policies.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{p.name}</div>
                  <div className="text-xs text-gray-500 font-mono">{p.id}</div>
                  {p.nlInput && (
                    <div className="mt-1 text-xs text-purple-600 italic truncate max-w-xs">
                      NL: &quot;{p.nlInput}&quot;
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-0.5 rounded ${domainColors[p.domain] ?? 'bg-gray-100'}`}>{p.domain}</span>
                </td>
                <td className="px-6 py-4 text-xs text-gray-600">{p.type.replace(/_/g, ' ')}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    p.status === 'active' && p.approved ? 'bg-green-100 text-green-700' :
                    !p.approved ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {!p.approved ? 'pending approval' : p.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">v{p.version}</td>
                <td className="px-6 py-4 text-xs text-gray-500 font-mono max-w-xs truncate">{p.regRef ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
