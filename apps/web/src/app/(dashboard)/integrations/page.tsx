export default function IntegrationsPage() {
  const integrations = [
    { id: 'INT-001', name: 'Core Banking System', provider: 'sap', type: 'erp_finance', status: 'active', lastSync: '2 min ago', health: 'healthy', signals: 520 },
    { id: 'INT-002', name: 'Splunk SIEM', provider: 'splunk', type: 'siem_security', status: 'active', lastSync: '30 sec ago', health: 'healthy', signals: 412 },
    { id: 'INT-003', name: 'Workday HR', provider: 'workday', type: 'hris', status: 'active', lastSync: '15 min ago', health: 'healthy', signals: 289 },
    { id: 'INT-004', name: 'Azure Active Directory', provider: 'azure_ad', type: 'iam', status: 'active', lastSync: '1 min ago', health: 'healthy', signals: 198 },
    { id: 'INT-005', name: 'Microsoft 365', provider: 'microsoft365', type: 'communication', status: 'active', lastSync: '5 min ago', health: 'degraded', signals: 285 },
    { id: 'INT-006', name: 'Jira', provider: 'jira', type: 'operations', status: 'active', lastSync: '10 min ago', health: 'healthy', signals: 156 },
    { id: 'INT-007', name: 'Salesforce CRM', provider: 'salesforce', type: 'crm', status: 'inactive', lastSync: 'Never', health: 'unconfigured', signals: 0 },
    { id: 'INT-008', name: 'PagerDuty', provider: 'pagerduty', type: 'operations', status: 'inactive', lastSync: 'Never', health: 'unconfigured', signals: 0 },
  ];

  const healthColors: Record<string, string> = {
    healthy: 'bg-green-100 text-green-700',
    degraded: 'bg-yellow-100 text-yellow-700',
    error: 'bg-red-100 text-red-700',
    unconfigured: 'bg-gray-100 text-gray-500',
  };

  const healthDots: Record<string, string> = {
    healthy: 'bg-green-500',
    degraded: 'bg-yellow-500',
    error: 'bg-red-500',
    unconfigured: 'bg-gray-300',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          Add Integration
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((int) => (
          <div key={int.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{int.name}</h3>
                <div className="text-xs text-gray-500 mt-0.5">{int.provider} — {int.type.replace(/_/g, ' ')}</div>
              </div>
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${healthColors[int.health]}`}>
                <div className={`h-2 w-2 rounded-full ${healthDots[int.health]} ${int.health === 'healthy' ? 'animate-pulse' : ''}`} />
                {int.health}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div>
                <div className="text-xs text-gray-500">Last Sync</div>
                <div className="text-sm font-medium">{int.lastSync}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Signals (24h)</div>
                <div className="text-sm font-medium">{int.signals.toLocaleString()}</div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              {int.status === 'active' ? (
                <>
                  <button className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-xs font-medium hover:bg-gray-200">
                    Test Connection
                  </button>
                  <button className="flex-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded text-xs font-medium hover:bg-blue-100">
                    Sync Now
                  </button>
                </>
              ) : (
                <button className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700">
                  Configure
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
