'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'users', label: 'Users & Roles' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'billing', label: 'Billing' },
    { id: 'api', label: 'API Keys' },
    { id: 'deployment', label: 'Deployment' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-48 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                  activeTab === tab.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'general' && <GeneralSettings />}
          {activeTab === 'users' && <UsersSettings />}
          {activeTab === 'notifications' && <NotificationSettings />}
          {activeTab === 'billing' && <BillingSettings />}
          {activeTab === 'api' && <ApiSettings />}
          {activeTab === 'deployment' && <DeploymentSettings />}
        </div>
      </div>
    </div>
  );
}

function GeneralSettings() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
      <h2 className="text-lg font-semibold">Organization Settings</h2>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
          <input type="text" defaultValue="Demo Community Bank" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
          <select defaultValue="banking" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white">
            <option value="banking">Banking</option>
            <option value="credit_union">Credit Union</option>
            <option value="healthcare">Healthcare</option>
            <option value="technology">Technology</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
          <select defaultValue="America/New_York" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white">
            <option value="America/New_York">Eastern (ET)</option>
            <option value="America/Chicago">Central (CT)</option>
            <option value="America/Denver">Mountain (MT)</option>
            <option value="America/Los_Angeles">Pacific (PT)</option>
            <option value="UTC">UTC</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data Retention (days)</label>
          <input type="number" defaultValue={365} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Privacy Level</label>
        <div className="space-y-2">
          {['Full anonymization (team-level only)', 'Partial (pseudonymized, identified on escalation)', 'None (identified in all views)'].map((opt, i) => (
            <label key={i} className="flex items-center gap-2 text-sm text-gray-600">
              <input type="radio" name="privacy" defaultChecked={i === 1} className="text-blue-600" />
              {opt}
            </label>
          ))}
        </div>
      </div>

      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Save Changes</button>
    </div>
  );
}

function UsersSettings() {
  const users = [
    { name: 'System Admin', email: 'admin@riskradar.dev', role: 'admin', status: 'active', lastLogin: '2h ago' },
    { name: 'Jane Analyst', email: 'analyst@riskradar.dev', role: 'analyst', status: 'active', lastLogin: '1h ago' },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Users & Roles</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">Invite User</button>
      </div>
      <table className="w-full">
        <thead><tr className="text-left text-xs text-gray-500 border-b">
          <th className="pb-2">Name</th><th className="pb-2">Email</th><th className="pb-2">Role</th><th className="pb-2">Status</th><th className="pb-2">Last Login</th>
        </tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.email} className="border-b last:border-0">
              <td className="py-3 text-sm font-medium">{u.name}</td>
              <td className="py-3 text-sm text-gray-500">{u.email}</td>
              <td className="py-3"><span className="text-xs px-2 py-0.5 bg-gray-100 rounded">{u.role}</span></td>
              <td className="py-3"><span className="text-xs text-green-600">{u.status}</span></td>
              <td className="py-3 text-sm text-gray-500">{u.lastLogin}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NotificationSettings() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
      <h2 className="text-lg font-semibold">Notification Preferences</h2>
      <div className="space-y-4">
        {[
          { channel: 'Email', desc: 'Send alerts via email', enabled: true },
          { channel: 'Slack', desc: 'Post to Slack channel', enabled: false },
          { channel: 'Microsoft Teams', desc: 'Post to Teams channel', enabled: false },
          { channel: 'SMS', desc: 'Text message for critical alerts', enabled: false },
        ].map((n) => (
          <div key={n.channel} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="text-sm font-medium text-gray-900">{n.channel}</div>
              <div className="text-xs text-gray-500">{n.desc}</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked={n.enabled} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
            </label>
          </div>
        ))}
      </div>
      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">Save Preferences</button>
    </div>
  );
}

function BillingSettings() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
      <h2 className="text-lg font-semibold">Billing & Subscription</h2>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-blue-900">Current Plan: Community (Free)</div>
            <div className="text-xs text-blue-700 mt-0.5">Self-hosted open source edition</div>
          </div>
          <a href="/pricing" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            Upgrade to Professional
          </a>
        </div>
      </div>
      <div className="text-sm text-gray-500">
        Upgrade to Professional or Enterprise for auto-learning, regulatory watchdog, SAR generation, and managed hosting.
      </div>
    </div>
  );
}

function ApiSettings() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
      <h2 className="text-lg font-semibold">API Keys</h2>
      <p className="text-sm text-gray-500">Use API keys for programmatic access to the RiskRadar API.</p>
      <button className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium">Generate API Key</button>
      <div className="text-xs text-gray-400">API documentation available at <code>/api/v1/docs</code></div>
    </div>
  );
}

function DeploymentSettings() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
      <h2 className="text-lg font-semibold">Deployment Information</h2>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500">Deployment Mode</div>
          <div className="font-medium">Self-Hosted (Docker)</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500">Inference Mode</div>
          <div className="font-medium">Cloud (Claude API)</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500">Version</div>
          <div className="font-mono font-medium">0.1.0</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500">Active Agents</div>
          <div className="font-medium">11 / 12</div>
        </div>
      </div>
    </div>
  );
}
