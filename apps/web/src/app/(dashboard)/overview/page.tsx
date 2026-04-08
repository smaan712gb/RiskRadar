'use client';

import { useOverviewKPIs, useAlerts, useTenant, useIC3ThreatData } from '@/lib/use-data';

export default function OverviewPage() {
  const { kpis, riskDistribution, signalStats } = useOverviewKPIs();
  const { data: alerts } = useAlerts();
  const { data: ic3 } = useIC3ThreatData();
  const tenant = useTenant();
  const recentAlerts = alerts.slice(0, 5);

  return (
    <div>
      {/* Tenant Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Risk Overview</h1>
          <p className="text-sm text-gray-500 mt-0.5">{tenant.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-gray-500">All systems operational</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <KPICard title="Active Alerts" value={String(kpis.activeAlerts.value)} change={kpis.activeAlerts.change} trend={kpis.activeAlerts.trend} color="red" />
        <KPICard title="Open Cases" value={String(kpis.openCases.value)} change={kpis.openCases.change} trend={kpis.openCases.trend} color="orange" />
        <KPICard title="High Risk Subjects" value={String(kpis.highRiskSubjects.value)} change={kpis.highRiskSubjects.change} trend={kpis.highRiskSubjects.trend} color="yellow" />
        <KPICard title="Signals (24h)" value={kpis.signals24h.value} change={kpis.signals24h.change} trend={kpis.signals24h.trend} color="blue" />
        <KPICard title="IC3 Threat Score" value={String(kpis.ic3ThreatScore.value)} change={kpis.ic3ThreatScore.change} trend={kpis.ic3ThreatScore.trend} color="purple" />
      </div>

      {/* IC3 Threat Landscape Widget */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">FBI IC3 2025 Threat Coverage</h2>
            <p className="text-xs text-gray-500 mt-0.5">Your exposure mapped against FBI Internet Crime Report top threat categories</p>
          </div>
          <a href="/threat-intel" className="text-sm text-blue-600 hover:text-blue-800 font-medium">Full Threat Intel →</a>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coverage Score */}
          <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
            <div className="text-4xl font-bold text-blue-600">{ic3.organizationExposure.coveragePercentage}%</div>
            <div className="text-sm text-gray-500 mt-1">IC3 Threat Coverage</div>
            <div className="text-xs text-gray-400 mt-0.5">{ic3.organizationExposure.activeModules}/{ic3.organizationExposure.totalModules} modules active</div>
            <div className="flex gap-1 mt-3">
              {ic3.weeklyTrend.map((w) => (
                <div key={w.week} className="flex flex-col items-center">
                  <div className="w-6 bg-gray-200 rounded-full overflow-hidden" style={{ height: 40 }}>
                    <div className="bg-blue-500 rounded-full w-full" style={{ height: `${w.score}%`, marginTop: `${100 - w.score}%` }} />
                  </div>
                  <span className="text-[9px] text-gray-400 mt-1">{w.week}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Threats */}
          <div className="col-span-2">
            <div className="space-y-2">
              {ic3.topThreats.slice(0, 5).map((threat) => (
                <div key={threat.category} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                    threat.priority === 'P0' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>{threat.priority}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{threat.category}</div>
                    <div className="text-xs text-gray-500">${(threat.losses / 1_000_000_000).toFixed(1)}B losses · {(threat.complaints / 1000).toFixed(0)}K complaints</div>
                  </div>
                  <div className={`text-xs font-medium ${threat.trend === 'NEW' ? 'text-purple-600' : 'text-red-500'}`}>{threat.trend}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    threat.moduleStatus === 'active' ? 'bg-green-100 text-green-700' :
                    threat.moduleStatus === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {threat.moduleStatus === 'active' ? 'Covered' : threat.moduleStatus === 'partial' ? 'Partial' : 'N/A'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Risk Heatmap + Signal Domains */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Risk Distribution</h2>
          <div className="space-y-3">
            <RiskBar label="Critical" count={riskDistribution.critical} total={19} color="bg-risk-critical" />
            <RiskBar label="High" count={riskDistribution.high} total={19} color="bg-risk-high" />
            <RiskBar label="Medium" count={riskDistribution.medium} total={19} color="bg-risk-medium" />
            <RiskBar label="Low" count={riskDistribution.low} total={19} color="bg-risk-low" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Signals by Domain (24h)</h2>
          <div className="space-y-2">
            <DomainBar label="Finance" count={signalStats.byDomain.finance} color="bg-blue-500" />
            <DomainBar label="Security" count={signalStats.byDomain.security} color="bg-red-500" />
            <DomainBar label="Operations" count={signalStats.byDomain.operations} color="bg-purple-500" />
            <DomainBar label="Communications" count={signalStats.byDomain.communications} color="bg-yellow-500" />
            <DomainBar label="HR" count={signalStats.byDomain.hr} color="bg-green-500" />
            <DomainBar label="Crypto" count={signalStats.byDomain.crypto} color="bg-orange-500" />
            <DomainBar label="BEC" count={signalStats.byDomain.bec} color="bg-pink-500" />
            <DomainBar label="Ransomware" count={signalStats.byDomain.ransomware} color="bg-rose-500" />
            <DomainBar label="Vendor Risk" count={signalStats.byDomain.vendor_risk} color="bg-indigo-500" />
            <DomainBar label="AI Threat" count={signalStats.byDomain.ai_threat} color="bg-violet-500" />
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Alerts</h2>
          <a href="/alerts" className="text-sm text-blue-600 hover:text-blue-800 font-medium">View all →</a>
        </div>
        <div className="space-y-3">
          {recentAlerts.map((alert) => (
            <a key={alert.id} href={`/alerts/${alert.id}`} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border ${
                alert.severity === 'critical' ? 'text-red-700 bg-red-50 border-red-200' :
                alert.severity === 'high' ? 'text-orange-700 bg-orange-50 border-orange-200' :
                'text-yellow-700 bg-yellow-50 border-yellow-200'
              }`}>
                {alert.severity}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{alert.title}</div>
                <div className="text-xs text-gray-500">
                  {alert.subjectId} · {alert.domains.join(', ')}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className={`text-sm font-bold ${alert.compoundScore >= 70 ? 'text-red-600' : 'text-yellow-600'}`}>
                  {alert.compoundScore}
                </div>
                <div className="text-xs text-gray-400">{alert.time}</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, change, trend, color }: {
  title: string; value: string; change: string; trend: 'up' | 'down'; color: string;
}) {
  const borderColor = { red: 'border-l-red-500', orange: 'border-l-orange-500', yellow: 'border-l-yellow-500', blue: 'border-l-blue-500', purple: 'border-l-purple-500' }[color] ?? 'border-l-gray-500';
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
  const max = 800;
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
