'use client';

import { usePolicies } from '@/lib/use-data';

const domainColors: Record<string, string> = {
  finance: 'bg-blue-100 text-blue-700',
  security: 'bg-red-100 text-red-700',
  hr: 'bg-green-100 text-green-700',
  operations: 'bg-purple-100 text-purple-700',
  compliance: 'bg-orange-100 text-orange-700',
  communications: 'bg-yellow-100 text-yellow-700',
};

export default function PoliciesPage() {
  const { data: policies, isDemo } = usePolicies();

  const activeCount = policies.filter((p) => p.status === 'active').length;
  const pendingCount = policies.filter((p) => p.status === 'pending_approval' || p.status === 'draft').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Monitoring Policies</h1>
          {isDemo && <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full ml-2">Demo Data</span>}
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
            Create from Natural Language
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            Create Policy
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 uppercase">Active Policies</div>
          <div className="text-2xl font-bold text-gray-900">{activeCount}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 uppercase">Pending / Draft</div>
          <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 uppercase">Regulatory-Linked</div>
          <div className="text-2xl font-bold text-blue-600">{policies.filter((p) => p.regulatory).length}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 uppercase">Domains Covered</div>
          <div className="text-2xl font-bold text-purple-600">{new Set(policies.map((p) => p.domain)).size}</div>
        </div>
      </div>

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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approved By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {policies.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{p.name}</div>
                  <div className="text-xs text-gray-500 font-mono">{p.id}</div>
                  {p.description && <div className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{p.description}</div>}
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-0.5 rounded ${domainColors[p.domain] ?? 'bg-gray-100'}`}>{p.domain}</span>
                </td>
                <td className="px-6 py-4 text-xs text-gray-600">{p.type.replace(/_/g, ' ')}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    p.status === 'active' ? 'bg-green-100 text-green-700' :
                    p.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {p.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">v{p.version}</td>
                <td className="px-6 py-4 text-xs text-gray-500 font-mono max-w-xs truncate">{p.regulatory ?? '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{p.approvedBy ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
