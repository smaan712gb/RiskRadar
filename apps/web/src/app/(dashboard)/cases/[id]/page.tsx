'use client';

import { useState } from 'react';

const mockCase = {
  id: 'CSE-001',
  title: 'Insider Transaction Fraud Investigation',
  description: 'Investigation into potential unauthorized transaction processing by EMP-4821 involving override abuse during supervisor absence.',
  status: 'investigating',
  priority: 'critical',
  subjectId: 'EMP-4821',
  assignee: { name: 'Jane Analyst', role: 'analyst' },
  creator: { name: 'System (Auto-escalated)' },
  slaDeadline: new Date(Date.now() + 4 * 60 * 60 * 1000),
  createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  alerts: [
    { id: 'ALT-0847', title: 'Compound Risk: Finance + Security — Score 91', severity: 'critical', score: 91 },
    { id: 'ALT-0839', title: 'Override Pattern: 5 overrides during supervisor absence', severity: 'high', score: 72 },
    { id: 'ALT-0812', title: 'After-hours data access for EMP-4821', severity: 'medium', score: 48 },
  ],
  comments: [
    { id: '1', author: 'System', content: 'Case auto-created from alert ALT-0847 escalation.', time: '2h ago', isSystem: true },
    { id: '2', author: 'Jane Analyst', content: 'Reviewing transaction logs. Override pattern confirmed — 3 wire transfers totaling $167,000 processed during manager PTO. Requesting BSA Officer review.', time: '1h ago', isSystem: false },
    { id: '3', author: 'Mike CCO', content: 'BSA Officer notified. Please preserve all evidence. Do NOT contact the subject until legal review is complete.', time: '45m ago', isSystem: false },
    { id: '4', author: 'System (Regulatory Watchdog)', content: 'Note: FinCEN Advisory 2025-A003 (Insider Threat Red Flags) directly applies to this case. SAR filing deadline: 30 calendar days from detection (April 14, 2026).', time: '30m ago', isSystem: true },
  ],
  tags: ['insider-threat', 'bsa-aml', 'override-abuse', 'sar-required'],
};

export default function CaseDetailPage() {
  const [newComment, setNewComment] = useState('');

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-mono text-gray-500">{mockCase.id}</span>
            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-semibold">{mockCase.priority}</span>
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">{mockCase.status.replace(/_/g, ' ')}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{mockCase.title}</h1>
          <p className="text-gray-600 mt-1">{mockCase.description}</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
            Generate SAR Draft
          </button>
          <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">
            Close Case
          </button>
        </div>
      </div>

      {/* Meta Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="text-xs text-gray-500">Subject</div>
          <div className="font-mono font-bold">{mockCase.subjectId}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="text-xs text-gray-500">Assigned To</div>
          <div className="font-medium">{mockCase.assignee.name}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="text-xs text-gray-500">SLA Deadline</div>
          <div className="font-medium text-orange-600">{mockCase.slaDeadline.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="text-xs text-gray-500">Linked Alerts</div>
          <div className="font-bold text-xl">{mockCase.alerts.length}</div>
        </div>
      </div>

      {/* Tags */}
      <div className="flex gap-2 mb-6">
        {mockCase.tags.map((tag) => (
          <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">{tag}</span>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main: Comments / Activity */}
        <div className="col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Investigation Activity</h2>

            <div className="space-y-4 mb-6">
              {mockCase.comments.map((comment) => (
                <div key={comment.id} className={`rounded-lg p-4 ${comment.isSystem ? 'bg-gray-50 border border-gray-200' : 'bg-blue-50 border border-blue-200'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-semibold ${comment.isSystem ? 'text-gray-600' : 'text-blue-900'}`}>
                      {comment.author}
                    </span>
                    <span className="text-xs text-gray-400">{comment.time}</span>
                  </div>
                  <p className="text-sm text-gray-800">{comment.content}</p>
                </div>
              ))}
            </div>

            {/* Add Comment */}
            <div className="border-t border-gray-200 pt-4">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add investigation notes..."
                className="w-full rounded-lg border border-gray-300 p-3 text-sm resize-none h-24 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="flex justify-between items-center mt-2">
                <label className="flex items-center gap-2 text-sm text-gray-500">
                  <input type="checkbox" defaultChecked className="rounded" />
                  Internal (not visible to subject)
                </label>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                  Add Comment
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: Linked Alerts */}
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Linked Alerts</h3>
            <div className="space-y-3">
              {mockCase.alerts.map((alert) => (
                <div key={alert.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-blue-600">{alert.id}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      alert.severity === 'critical' ? 'bg-red-100 text-red-700' :
                      alert.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>{alert.severity}</span>
                  </div>
                  <p className="text-xs text-gray-700">{alert.title}</p>
                  <div className="text-xs text-gray-500 mt-1">Score: <span className="font-bold">{alert.score}</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
