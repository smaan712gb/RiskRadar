'use client';

import { useIntegrations } from '@/lib/use-data';

const healthColors: Record<string, string> = {
  healthy: 'bg-green-100 text-green-700',
  degraded: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
  unknown: 'bg-gray-100 text-gray-500',
};

const healthDots: Record<string, string> = {
  healthy: 'bg-green-500',
  degraded: 'bg-yellow-500',
  error: 'bg-red-500',
  unknown: 'bg-gray-300',
};

export default function IntegrationsPage() {
  const { data: integrations, isDemo } = useIntegrations();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
          {isDemo && <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full ml-2">Demo Data</span>}
        </div>
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
                <div className="text-xs text-gray-500">Signals</div>
                <div className="text-sm font-medium">{int.signals}</div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              {int.status === 'connected' ? (
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
