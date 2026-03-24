export default function OverviewPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Risk Overview</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard title="Active Alerts" value="23" change="+5" trend="up" color="red" />
        <KPICard title="Open Cases" value="8" change="-2" trend="down" color="orange" />
        <KPICard title="High Risk Subjects" value="12" change="+3" trend="up" color="yellow" />
        <KPICard title="Signals (24h)" value="1,847" change="+12%" trend="up" color="blue" />
      </div>

      {/* Risk Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Risk Distribution</h2>
          <div className="space-y-3">
            <RiskBar label="Critical" count={3} total={50} color="bg-risk-critical" />
            <RiskBar label="High" count={9} total={50} color="bg-risk-high" />
            <RiskBar label="Medium" count={18} total={50} color="bg-risk-medium" />
            <RiskBar label="Low" count={20} total={50} color="bg-risk-low" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Signals by Domain</h2>
          <div className="space-y-3">
            <DomainBar label="Finance" count={520} color="bg-blue-500" />
            <DomainBar label="Security" count={412} color="bg-red-500" />
            <DomainBar label="HR" count={289} color="bg-green-500" />
            <DomainBar label="Operations" count={341} color="bg-purple-500" />
            <DomainBar label="Communications" count={285} color="bg-yellow-500" />
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Alerts</h2>
        <div className="text-sm text-gray-500">
          Connect to the API to see live alert data. Start the API server and configure integrations.
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, change, trend, color }: {
  title: string; value: string; change: string; trend: 'up' | 'down'; color: string;
}) {
  const borderColor = { red: 'border-l-red-500', orange: 'border-l-orange-500', yellow: 'border-l-yellow-500', blue: 'border-l-blue-500' }[color] ?? 'border-l-gray-500';
  return (
    <div className={`bg-white rounded-xl border border-gray-200 border-l-4 ${borderColor} p-6`}>
      <div className="text-sm text-gray-500 mb-1">{title}</div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
      <div className={`text-sm mt-1 ${trend === 'up' ? 'text-red-500' : 'text-green-500'}`}>
        {change} vs last week
      </div>
    </div>
  );
}

function RiskBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = (count / total) * 100;
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 text-sm text-gray-600">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-3">
        <div className={`${color} rounded-full h-3`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-sm text-gray-600 text-right">{count}</span>
    </div>
  );
}

function DomainBar({ label, count, color }: { label: string; count: number; color: string }) {
  const max = 600;
  const pct = (count / max) * 100;
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 text-sm text-gray-600">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-3">
        <div className={`${color} rounded-full h-3`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-12 text-sm text-gray-600 text-right">{count}</span>
    </div>
  );
}
