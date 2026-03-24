'use client';

import { useState } from 'react';
import { severityColor, formatRelativeTime } from '@/lib/utils';

// In production, this comes from API via params + fetch
const mockAlert = {
  id: 'ALT-2026-0847',
  title: 'Compound Risk: Finance + Security — Score 91',
  description: 'Cross-domain risk pattern detected involving transaction overrides during supervisor absence combined with after-hours data access.',
  alertType: 'compound_risk',
  severity: 'critical',
  status: 'under_review',
  compoundScore: 91,
  confidenceScore: 89,
  falsePositiveLikelihood: 'low',
  domains: ['finance', 'security', 'hr'],
  subjectType: 'employee',
  subjectId: 'EMP-4821',
  assignedTo: { name: 'Jane Analyst', email: 'jane@demo-bank.com' },
  reviewedBy: null,
  reasoningModelUsed: 'tier2_cascade',
  processingTimeMs: 4200,
  createdAt: new Date(Date.now() - 14 * 60 * 1000),
  evidenceBrief: {
    summary: 'The combination of supervisor absence, after-hours access, new recipient accounts, and override clustering represents a compound risk pattern consistent with potential unauthorized transaction activity.',
    evidenceChain: [
      { sequence: 1, timestamp: '2026-03-15T14:23:00Z', description: 'Processed 3 wire transfers >$50K each with manager override', sourceSystem: 'Core Banking API', sourceId: 'tx_7821,7822,7825', signalType: 'override_transaction', significance: 'Override volume 3x exceeds monthly baseline of 0.2' },
      { sequence: 2, timestamp: '2026-03-14T00:00:00Z', description: 'Direct supervisor on PTO (Mar 14-18)', sourceSystem: 'HRIS Calendar API', sourceId: 'absence_A-2847', signalType: 'leave_pattern_change', significance: 'Override clustering correlates with supervisor absence (p < 0.01)' },
      { sequence: 3, timestamp: '2026-03-14T23:47:00Z', description: 'Accessed client records for recipient accounts at 11:47 PM', sourceSystem: 'AD Audit Log', sourceId: 'event_E-9921,E-9922', signalType: 'after_hours_access', significance: 'Access outside normal 8AM-6PM business hours' },
      { sequence: 4, timestamp: '2026-03-15T09:15:00Z', description: 'Two of three recipient accounts created within 48hrs of transfer', sourceSystem: 'Core Banking API', sourceId: 'acct_A-1104,A-1105', signalType: 'new_payee', significance: 'New payee creation proximate to large transfers is a structuring indicator' },
      { sequence: 5, timestamp: '2026-03-10T00:00:00Z', description: 'Employee skipped mandatory AML refresher training (due Mar 1)', sourceSystem: 'HRIS Training API', sourceId: 'training_T-4421', signalType: 'training_missed', significance: 'Compliance training non-completion elevates risk context' },
    ],
    reasoning: 'The combination of supervisor absence, after-hours access, new recipient accounts, and override clustering suggests potential unauthorized transaction activity. Each signal alone is low-severity, but together they match known indicators for insider-facilitated financial crime. The temporal correlation (all events within a 5-day window) and the override-during-absence pattern are particularly significant. This pattern matches BSA/AML red flag indicators per FinCEN Advisory 2025-A003.',
    regulatoryMapping: [
      { regulation: 'BSA/AML', section: 'FinCEN Advisory 2025-A003', description: 'Insider threat red flag indicators 4, 7, 12', relevance: 'direct' },
      { regulation: 'BSA/AML', section: '31 CFR 1020.320', description: 'SAR filing requirements for suspicious transactions >$5,000', relevance: 'direct' },
      { regulation: 'OCC', section: 'Bulletin 2024-15', description: 'Insider threat controls for national banks', relevance: 'related' },
    ],
    recommendedActions: [
      { priority: 'immediate', action: 'Freeze override privileges for EMP-4821 pending review' },
      { priority: 'within_24h', action: 'BSA Officer review of transactions tx_7821, tx_7822, tx_7825' },
      { priority: 'within_72h', action: 'SAR filing assessment per 31 CFR 1020.320' },
      { priority: 'within_week', action: 'Review all EMP-4821 transactions for the past 90 days' },
    ],
    confidenceScore: 91,
    falsePositiveLikelihood: 'low',
  },
};

export default function AlertDetailPage() {
  const [activeTab, setActiveTab] = useState<'evidence' | 'reasoning' | 'regulatory' | 'actions' | 'timeline'>('evidence');
  const alert = mockAlert;
  const brief = alert.evidenceBrief;

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold border ${severityColor(alert.severity)}`}>
              {alert.severity.toUpperCase()}
            </span>
            <span className="text-sm text-gray-500 font-mono">{alert.id}</span>
            <span className="text-sm text-gray-400">{formatRelativeTime(alert.createdAt)}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{alert.title}</h1>
          <p className="text-gray-600 mt-1">{alert.description}</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600">
            Mark Under Review
          </button>
          <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
            Escalate to Case
          </button>
          <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">
            Dismiss
          </button>
        </div>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <ScoreCard label="Compound Score" value={alert.compoundScore} max={100} color={alert.compoundScore >= 70 ? 'red' : 'yellow'} />
        <ScoreCard label="Confidence" value={alert.confidenceScore} max={100} color="blue" />
        <ScoreCard label="FP Likelihood" value={alert.falsePositiveLikelihood} color="green" isText />
        <ScoreCard label="Reasoning Tier" value={alert.reasoningModelUsed === 'tier2_cascade' ? 'Cascade-2' : 'Super'} color="purple" isText />
        <ScoreCard label="Processing" value={`${(alert.processingTimeMs / 1000).toFixed(1)}s`} color="gray" isText />
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 uppercase mb-1">Subject</div>
          <div className="font-mono font-bold text-lg">{alert.subjectId}</div>
          <div className="text-sm text-gray-500">{alert.subjectType}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 uppercase mb-1">Domains</div>
          <div className="flex gap-1 flex-wrap mt-1">
            {alert.domains.map((d) => (
              <span key={d} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm font-medium">{d}</span>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 uppercase mb-1">Assigned To</div>
          <div className="font-medium">{alert.assignedTo?.name ?? 'Unassigned'}</div>
          <div className="text-sm text-gray-500">{alert.assignedTo?.email}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex">
            {(['evidence', 'reasoning', 'regulatory', 'actions', 'timeline'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'evidence' && <EvidenceTab brief={brief} />}
          {activeTab === 'reasoning' && <ReasoningTab brief={brief} />}
          {activeTab === 'regulatory' && <RegulatoryTab brief={brief} />}
          {activeTab === 'actions' && <ActionsTab brief={brief} />}
          {activeTab === 'timeline' && <TimelineTab brief={brief} />}
        </div>
      </div>
    </div>
  );
}

function ScoreCard({ label, value, max, color, isText }: {
  label: string; value: string | number; max?: number; color: string; isText?: boolean;
}) {
  const colorClasses: Record<string, string> = {
    red: 'text-red-600', yellow: 'text-yellow-600', blue: 'text-blue-600',
    green: 'text-green-600', purple: 'text-purple-600', gray: 'text-gray-600',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
      <div className="text-xs text-gray-500 uppercase mb-1">{label}</div>
      <div className={`text-2xl font-bold ${colorClasses[color]}`}>
        {isText ? value : `${value}${max ? `/${max}` : ''}`}
      </div>
    </div>
  );
}

function EvidenceTab({ brief }: { brief: typeof mockAlert.evidenceBrief }) {
  return (
    <div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-1">Summary</h3>
        <p className="text-blue-800 text-sm">{brief.summary}</p>
      </div>

      <h3 className="font-semibold text-gray-900 mb-4">Evidence Chain ({brief.evidenceChain.length} items)</h3>
      <div className="space-y-4">
        {brief.evidenceChain.map((item) => (
          <div key={item.sequence} className="relative pl-8 pb-4 border-l-2 border-gray-200 last:border-l-0">
            <div className="absolute left-[-9px] top-0 h-4 w-4 rounded-full bg-blue-500 border-2 border-white" />
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-blue-600">#{item.sequence}</span>
                <span className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleString()}</span>
                <span className="text-xs px-1.5 py-0.5 bg-gray-200 rounded font-mono">{item.signalType}</span>
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">{item.description}</p>
              <p className="text-xs text-gray-500 mb-2">
                Source: <span className="font-mono">{item.sourceSystem}</span> | Ref: <span className="font-mono">{item.sourceId}</span>
              </p>
              <div className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 inline-block">
                {item.significance}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReasoningTab({ brief }: { brief: typeof mockAlert.evidenceBrief }) {
  return (
    <div>
      <h3 className="font-semibold text-gray-900 mb-3">AI Reasoning Chain</h3>
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
            Nemotron-Cascade-2 (Thinking Mode)
          </span>
          <span className="text-xs text-gray-400">Gold Medal Reasoning Engine</span>
        </div>
        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{brief.reasoning}</p>
      </div>
    </div>
  );
}

function RegulatoryTab({ brief }: { brief: typeof mockAlert.evidenceBrief }) {
  return (
    <div>
      <h3 className="font-semibold text-gray-900 mb-4">Regulatory Mapping</h3>
      <div className="space-y-3">
        {brief.regulatoryMapping.map((reg, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-gray-900">{reg.regulation}</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 font-mono">{reg.section}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                reg.relevance === 'direct' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {reg.relevance}
              </span>
            </div>
            <p className="text-sm text-gray-600">{reg.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionsTab({ brief }: { brief: typeof mockAlert.evidenceBrief }) {
  const priorityColors: Record<string, string> = {
    immediate: 'bg-red-100 text-red-800 border-red-200',
    within_24h: 'bg-orange-100 text-orange-800 border-orange-200',
    within_72h: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    within_week: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  return (
    <div>
      <h3 className="font-semibold text-gray-900 mb-4">Recommended Actions</h3>
      <div className="space-y-3">
        {brief.recommendedActions.map((action, i) => (
          <div key={i} className={`flex items-start gap-3 p-4 rounded-lg border ${priorityColors[action.priority] ?? 'bg-gray-50'}`}>
            <div className="flex-shrink-0 mt-0.5">
              <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold uppercase mb-1">{action.priority.replace(/_/g, ' ')}</div>
              <p className="text-sm">{action.action}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineTab({ brief }: { brief: typeof mockAlert.evidenceBrief }) {
  const sorted = [...brief.evidenceChain].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  return (
    <div>
      <h3 className="font-semibold text-gray-900 mb-4">Event Timeline</h3>
      <div className="relative">
        {sorted.map((item, i) => (
          <div key={i} className="flex gap-4 mb-6 last:mb-0">
            <div className="flex-shrink-0 w-32 text-right">
              <div className="text-xs font-medium text-gray-900">{new Date(item.timestamp).toLocaleDateString()}</div>
              <div className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleTimeString()}</div>
            </div>
            <div className="flex-shrink-0 flex flex-col items-center">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              {i < sorted.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
            </div>
            <div className="flex-1 pb-2">
              <div className="text-sm font-medium text-gray-900">{item.description}</div>
              <div className="text-xs text-gray-500 mt-0.5">{item.sourceSystem} — {item.signalType}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
