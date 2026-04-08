'use client';

import Link from 'next/link';
import { useCases } from '@/lib/use-data';

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  investigating: 'bg-purple-100 text-purple-700',
  pending_review: 'bg-yellow-100 text-yellow-700',
  pending_legal: 'bg-red-100 text-red-700',
  action_required: 'bg-orange-100 text-orange-700',
  closed_confirmed: 'bg-green-100 text-green-700',
  closed_false_positive: 'bg-gray-100 text-gray-500',
  closed_no_action: 'bg-gray-100 text-gray-500',
};

const priorityColors: Record<string, string> = {
  critical: 'text-red-600 font-bold',
  high: 'text-orange-600 font-semibold',
  medium: 'text-yellow-600',
  low: 'text-gray-500',
};

const slaColors: Record<string, string> = {
  on_track: 'text-green-600',
  at_risk: 'text-yellow-600',
  breached: 'text-red-600 font-bold',
  met: 'text-green-500',
};

export default function CasesPage() {
  const { data: cases, isDemo } = useCases();

  const openCount = cases.filter((c) => !c.status.startsWith('closed')).length;
  const overdueCount = cases.filter((c) => c.slaStatus === 'breached').length;
  const closedThisWeek = cases.filter((c) => c.status.startsWith('closed')).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cases</h1>
          {isDemo && <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full ml-2">Demo Data</span>}
        </div>
        <div className="flex gap-2">
          <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option>All Statuses</option>
            <option>Open</option>
            <option>Investigating</option>
            <option>Pending Legal</option>
            <option>Action Required</option>
            <option>Closed</option>
          </select>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            Create Case
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Open Cases" value={String(openCount)} />
        <StatCard label="Overdue (SLA)" value={String(overdueCount)} alert={overdueCount > 0} />
        <StatCard label="Avg Resolution" value="4.1d" />
        <StatCard label="Closed This Week" value={String(closedThisWeek)} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Case</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assignee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alerts</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SLA</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {cases.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-6 py-4">
                  <Link href={`/cases/${c.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                    {c.id}
                  </Link>
                  <div className="text-sm text-gray-900 mt-0.5 max-w-xs truncate">{c.title}</div>
                </td>
                <td className={`px-6 py-4 text-sm ${priorityColors[c.priority]}`}>{c.priority}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColors[c.status] ?? 'bg-gray-100'}`}>
                    {c.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-mono text-gray-600">{c.subjectId}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{c.assignee}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{c.alerts}</td>
                <td className={`px-6 py-4 text-sm ${slaColors[c.slaStatus]}`}>{c.slaStatus.replace(/_/g, ' ')}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{c.created}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className={`bg-white rounded-xl border p-4 ${alert ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
      <div className="text-xs text-gray-500 uppercase">{label}</div>
      <div className={`text-2xl font-bold ${alert ? 'text-red-600' : 'text-gray-900'}`}>{value}</div>
    </div>
  );
}
