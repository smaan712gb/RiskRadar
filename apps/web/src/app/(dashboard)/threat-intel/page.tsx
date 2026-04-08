'use client';

import { useIC3ThreatData, useVendorRisks, useAlerts } from '@/lib/use-data';

export default function ThreatIntelPage() {
  const { data: ic3 } = useIC3ThreatData();
  const { data: vendorRisks } = useVendorRisks();
  const { data: alerts } = useAlerts();

  // Filter IC3-related alerts
  const ic3Alerts = alerts.filter((a) =>
    a.domains.some((d: string) => ['crypto', 'bec', 'ai_threat', 'ransomware', 'vendor_risk'].includes(d))
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Threat Intelligence</h1>
          <p className="text-sm text-gray-500 mt-0.5">FBI IC3 2025 threat landscape mapped to your risk posture</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">Source: FBI IC3 2025 Report</span>
        </div>
      </div>

      {/* IC3 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <div className="text-3xl font-bold text-gray-900">1M+</div>
          <div className="text-sm text-gray-500 mt-1">IC3 Complaints (2025)</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <div className="text-3xl font-bold text-red-600">$20B+</div>
          <div className="text-sm text-gray-500 mt-1">Total Losses</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <div className="text-3xl font-bold text-blue-600">{ic3.organizationExposure.coveragePercentage}%</div>
          <div className="text-sm text-gray-500 mt-1">Your Coverage</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <div className="text-3xl font-bold text-orange-600">{ic3.organizationExposure.overallScore}</div>
          <div className="text-sm text-gray-500 mt-1">Threat Exposure Score</div>
        </div>
      </div>

      {/* IC3 Threat Categories */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">FBI IC3 Top Threat Categories — Coverage Map</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Threat Category</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Losses (2025)</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Complaints</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Trend</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">RiskRadar Module</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ic3.topThreats.map((threat) => (
                <tr key={threat.category} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                      threat.priority === 'P0' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>{threat.priority}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-sm text-gray-900">{threat.category}</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-red-600">
                    ${(threat.losses / 1_000_000_000).toFixed(1)}B
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600">
                    {(threat.complaints / 1000).toFixed(0)}K
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-medium ${threat.trend === 'NEW' ? 'text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded' : 'text-red-500'}`}>
                      {threat.trend}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{threat.riskRadarModule}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      threat.moduleStatus === 'active' ? 'bg-green-100 text-green-800' :
                      threat.moduleStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {threat.moduleStatus === 'active' ? 'Active' : threat.moduleStatus === 'partial' ? 'Partial' : 'N/A'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two-column: Active IC3 Alerts + Vendor Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Active IC3-Related Alerts */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Active IC3-Related Alerts</h2>
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">{ic3Alerts.length} active</span>
          </div>
          <div className="space-y-3">
            {ic3Alerts.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-4">No active IC3-related alerts</div>
            ) : (
              ic3Alerts.map((alert) => (
                <a key={alert.id} href={`/alerts/${alert.id}`} className="block p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${
                      alert.severity === 'critical' ? 'bg-red-100 text-red-700' :
                      alert.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>{alert.severity}</span>
                    <span className={`text-sm font-bold ${alert.compoundScore >= 70 ? 'text-red-600' : 'text-yellow-600'}`}>
                      {alert.compoundScore}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-gray-900 truncate">{alert.title}</div>
                  <div className="text-xs text-gray-500 mt-1">{alert.domains.join(', ')} · {alert.time}</div>
                </a>
              ))
            )}
          </div>
        </div>

        {/* Vendor / Supply Chain Risk */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Supply Chain Vendor Risk</h2>
          <div className="space-y-3">
            {vendorRisks.map((vendor) => (
              <div key={vendor.id} className="p-3 rounded-lg border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{vendor.name}</div>
                    <div className="text-xs text-gray-500">{vendor.category} · {vendor.dataAccess}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      vendor.securityRating === 'A+' || vendor.securityRating === 'A' ? 'bg-green-100 text-green-700' :
                      vendor.securityRating === 'B' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>{vendor.securityRating}</span>
                    {vendor.previousRating !== vendor.securityRating && (
                      <span className="text-xs text-red-500">(was {vendor.previousRating})</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <span className="text-gray-500">Risk Score:</span>{' '}
                    <span className={`font-bold ${vendor.riskScore >= 60 ? 'text-red-600' : vendor.riskScore >= 40 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {vendor.riskScore}
                    </span>
                    {vendor.previousScore !== vendor.riskScore && (
                      <span className="text-gray-400 ml-1">(was {vendor.previousScore})</span>
                    )}
                  </div>
                  <div>
                    <span className="text-gray-500">Critical Findings:</span>{' '}
                    <span className={`font-bold ${vendor.criticalFindings > 0 ? 'text-red-600' : 'text-green-600'}`}>{vendor.criticalFindings}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Impact:</span>{' '}
                    <span className={`font-medium ${vendor.businessImpact === 'critical' ? 'text-red-600' : 'text-yellow-600'}`}>{vendor.businessImpact}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* New Modules Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">IC3-Aligned Detection Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ModuleCard
            name="BEC Defense Suite"
            status="active"
            signals={186}
            description="Email behavior analytics, writing style deviation detection, vendor impersonation monitoring, payment verification workflows"
            ic3Category="Business Email Compromise — $3B+"
            agent="BEC Analyzer"
          />
          <ModuleCard
            name="Crypto Fraud Radar"
            status="active"
            signals={214}
            description="Wallet risk scoring via Chainalysis/TRM Labs, pig butchering pattern detection, mixer/sanctions screening, transaction anomaly engine"
            ic3Category="Investment/Crypto Fraud — $8.6B + $7.2B"
            agent="Crypto Fraud Detector"
          />
          <ModuleCard
            name="AI Threat Intel Feed"
            status="active"
            signals={98}
            description="AI-generated phishing detection, deepfake tool tracking, LLM-crafted template fingerprinting, OSINT feed curation"
            ic3Category="AI-Enabled Scams — $893M (NEW in IC3 2025)"
            agent="AI Threat Intel"
          />
          <ModuleCard
            name="Ransomware Exposure Engine"
            status="active"
            signals={192}
            description="Attack surface scoring against MITRE ATT&CK TTPs, CVE-to-ransomware-group mapping, dark web intelligence, exposed service detection"
            ic3Category="Ransomware — Growing (underreported)"
            agent="Ransomware Exposure Engine"
          />
          <ModuleCard
            name="Supply Chain Risk Monitor"
            status="active"
            signals={156}
            description="Vendor security posture scoring via SecurityScorecard, breach alert monitoring, compliance certification tracking, credential leak detection"
            ic3Category="Cross-cutting: supply chain ransomware vector"
            agent="Vendor Risk Monitor"
          />
          <ModuleCard
            name="Elder Fraud Detection"
            status="partial"
            signals={0}
            description="Insider-side detection: flag employee patterns consistent with facilitating elder exploitation. B2C customer-facing detection is out of scope."
            ic3Category="Elder Fraud (60+) — $7.7B"
            agent="Covered by Fusion Engine"
          />
        </div>
      </div>
    </div>
  );
}

function ModuleCard({ name, status, signals, description, ic3Category, agent }: {
  name: string; status: 'active' | 'partial' | 'planned'; signals: number; description: string; ic3Category: string; agent: string;
}) {
  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm text-gray-900">{name}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          status === 'active' ? 'bg-green-100 text-green-700' :
          status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
          'bg-gray-100 text-gray-500'
        }`}>{status}</span>
      </div>
      <div className="text-xs text-red-600 font-medium mb-2">{ic3Category}</div>
      <p className="text-xs text-gray-600 mb-3">{description}</p>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Agent: {agent}</span>
        {signals > 0 && <span className="font-medium text-gray-700">{signals} signals/24h</span>}
      </div>
    </div>
  );
}
