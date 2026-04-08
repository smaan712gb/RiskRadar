export default function AgentsPage() {
  const agents = [
    // Collection Team
    { id: 'finance-collector', name: 'Finance Collector', team: 'collection', domain: 'finance', status: 'running', uptime: '14d 7h', signals: 12840, lastHeartbeat: '2s ago', model: 'Tier 1 (Super)', cpu: '12%', mem: '2.1GB' },
    { id: 'security-collector', name: 'Security Collector', team: 'collection', domain: 'security', status: 'running', uptime: '14d 7h', signals: 9832, lastHeartbeat: '1s ago', model: 'Tier 1 (Super)', cpu: '18%', mem: '2.8GB' },
    { id: 'hr-collector', name: 'HR Collector', team: 'collection', domain: 'hr', status: 'running', uptime: '14d 7h', signals: 5291, lastHeartbeat: '3s ago', model: 'Tier 1 (Super)', cpu: '6%', mem: '1.4GB' },
    { id: 'ops-collector', name: 'Operations Collector', team: 'collection', domain: 'operations', status: 'running', uptime: '14d 7h', signals: 6847, lastHeartbeat: '2s ago', model: 'Tier 1 (Super)', cpu: '8%', mem: '1.6GB' },
    { id: 'comms-collector', name: 'Communications Collector', team: 'collection', domain: 'communications', status: 'running', uptime: '14d 7h', signals: 5712, lastHeartbeat: '4s ago', model: 'Tier 1 (Super)', cpu: '7%', mem: '1.5GB' },
    // Analysis Team — Core
    { id: 'fusion-agent', name: 'Cross-Domain Fusion', team: 'analysis', domain: 'all', status: 'processing', uptime: '14d 7h', signals: 0, lastHeartbeat: '1s ago', model: 'Tier 1 + Tier 2', cpu: '34%', mem: '6.2GB' },
    { id: 'regulatory-watchdog', name: 'Regulatory Watchdog', team: 'analysis', domain: 'compliance', status: 'idle', uptime: '14d 7h', signals: 0, lastHeartbeat: '2h ago', model: 'Tier 2 (Cascade-2)', cpu: '1%', mem: '0.8GB' },
    { id: 'trajectory-engine', name: 'Trajectory Engine', team: 'analysis', domain: 'all', status: 'running', uptime: '14d 7h', signals: 0, lastHeartbeat: '30s ago', model: 'Tier 1 (Super)', cpu: '5%', mem: '1.2GB' },
    // Analysis Team — IC3 2025 Enhancement Modules
    { id: 'crypto-fraud', name: 'Crypto Fraud Detector', team: 'ic3_analysis', domain: 'crypto', status: 'running', uptime: '3d 12h', signals: 214, lastHeartbeat: '3s ago', model: 'Tier 1 (Super)', cpu: '15%', mem: '3.2GB' },
    { id: 'bec-analyzer', name: 'BEC Analyzer', team: 'ic3_analysis', domain: 'bec', status: 'running', uptime: '3d 12h', signals: 186, lastHeartbeat: '12s ago', model: 'Tier 2 (Cascade-2)', cpu: '22%', mem: '4.1GB' },
    { id: 'ai-threat-intel', name: 'AI Threat Intel', team: 'ic3_analysis', domain: 'ai_threat', status: 'running', uptime: '3d 12h', signals: 98, lastHeartbeat: '30s ago', model: 'Tier 1 (Super)', cpu: '8%', mem: '1.8GB' },
    { id: 'ransomware-engine', name: 'Ransomware Exposure Engine', team: 'ic3_analysis', domain: 'ransomware', status: 'running', uptime: '3d 12h', signals: 192, lastHeartbeat: '1s ago', model: 'Tier 1 + MITRE ATT&CK', cpu: '19%', mem: '3.5GB' },
    { id: 'vendor-risk', name: 'Vendor Risk Monitor', team: 'ic3_analysis', domain: 'vendor_risk', status: 'running', uptime: '3d 12h', signals: 156, lastHeartbeat: '6h ago', model: 'Tier 1 (Super)', cpu: '4%', mem: '1.0GB' },
    // Response Team
    { id: 'alert-router', name: 'Alert Router', team: 'response', domain: 'all', status: 'running', uptime: '14d 7h', signals: 0, lastHeartbeat: '1s ago', model: 'Tier 1 (Super)', cpu: '3%', mem: '0.9GB' },
    { id: 'notification-agent', name: 'Notification Router', team: 'response', domain: 'all', status: 'idle', uptime: '14d 7h', signals: 0, lastHeartbeat: '5s ago', model: 'None', cpu: '1%', mem: '0.4GB' },
    { id: 'sar-generator', name: 'SAR Generator', team: 'response', domain: 'finance', status: 'idle', uptime: '14d 7h', signals: 0, lastHeartbeat: '1h ago', model: 'Tier 2 (Cascade-2)', cpu: '0%', mem: '0.3GB' },
  ];

  const statusColors: Record<string, { dot: string; text: string }> = {
    running: { dot: 'bg-green-500 animate-pulse', text: 'text-green-700' },
    processing: { dot: 'bg-blue-500 animate-pulse', text: 'text-blue-700' },
    idle: { dot: 'bg-gray-400', text: 'text-gray-500' },
    error: { dot: 'bg-red-500', text: 'text-red-700' },
    stopped: { dot: 'bg-red-400', text: 'text-red-600' },
  };

  const teamColors: Record<string, string> = {
    collection: 'bg-blue-50 text-blue-700',
    analysis: 'bg-purple-50 text-purple-700',
    ic3_analysis: 'bg-orange-50 text-orange-700',
    response: 'bg-green-50 text-green-700',
  };

  const teamLabels: Record<string, string> = {
    collection: 'collection',
    analysis: 'analysis',
    ic3_analysis: 'IC3 analysis',
    response: 'response',
  };

  const activeCount = agents.filter((a) => a.status === 'running' || a.status === 'processing').length;
  const ic3Count = agents.filter((a) => a.team === 'ic3_analysis').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Agent Status</h1>
        <div className="flex gap-4">
          <div className="text-sm text-gray-500">
            <span className="font-bold text-green-600">{activeCount}</span> active /
            <span className="font-bold ml-1">{agents.length}</span> total
          </div>
          <span className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-full font-medium">
            +{ic3Count} IC3 modules
          </span>
        </div>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => {
          const sc = statusColors[agent.status] ?? statusColors['stopped']!;
          return (
            <div key={agent.id} className={`bg-white rounded-xl border p-5 ${agent.team === 'ic3_analysis' ? 'border-orange-200' : 'border-gray-200'}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${sc.dot}`} />
                    <h3 className="font-semibold text-gray-900 text-sm">{agent.name}</h3>
                  </div>
                  <div className="flex gap-1.5 mt-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${teamColors[agent.team]}`}>{teamLabels[agent.team]}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{agent.domain}</span>
                  </div>
                </div>
                <span className={`text-xs font-medium ${sc.text}`}>{agent.status}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs mt-3">
                <div><span className="text-gray-500">Model:</span> <span className="font-medium">{agent.model}</span></div>
                <div><span className="text-gray-500">Uptime:</span> <span className="font-medium">{agent.uptime}</span></div>
                <div><span className="text-gray-500">CPU:</span> <span className="font-medium">{agent.cpu}</span></div>
                <div><span className="text-gray-500">Memory:</span> <span className="font-medium">{agent.mem}</span></div>
                <div><span className="text-gray-500">Heartbeat:</span> <span className="font-medium">{agent.lastHeartbeat}</span></div>
                {agent.signals > 0 && (
                  <div><span className="text-gray-500">Signals:</span> <span className="font-medium">{agent.signals.toLocaleString()}</span></div>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <button className="flex-1 px-2 py-1.5 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200">
                  Logs
                </button>
                <button className="flex-1 px-2 py-1.5 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200">
                  Restart
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
