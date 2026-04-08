'use client';

import { useRiskScores } from '@/lib/use-data';

export default function RiskScoresPage() {
  const { data: subjects, isDemo } = useRiskScores();

  const distribution = {
    critical: subjects.filter((s) => s.score >= 75).length,
    high: subjects.filter((s) => s.score >= 50 && s.score < 75).length,
    medium: subjects.filter((s) => s.score >= 25 && s.score < 50).length,
    low: subjects.filter((s) => s.score < 25).length,
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Risk Scores</h1>
        {isDemo && <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Demo Data</span>}
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <DistCard label="Critical (75+)" count={distribution.critical} color="red" />
        <DistCard label="High (50-74)" count={distribution.high} color="orange" />
        <DistCard label="Medium (25-49)" count={distribution.medium} color="yellow" />
        <DistCard label="Low (0-24)" count={distribution.low} color="green" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trajectory</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Change (30d)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Domain Breakdown</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {subjects.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-6 py-4">
                  <div className="text-sm font-mono font-medium text-blue-600">{s.id}</div>
                  <div className="text-xs text-gray-500">{s.type}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{s.dept}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className={`text-lg font-bold ${
                      s.score >= 75 ? 'text-red-600' : s.score >= 50 ? 'text-orange-600' : s.score >= 25 ? 'text-yellow-600' : 'text-green-600'
                    }`}>{s.score}</div>
                    <div className="w-16 bg-gray-100 rounded-full h-2">
                      <div className={`h-2 rounded-full ${
                        s.score >= 75 ? 'bg-red-500' : s.score >= 50 ? 'bg-orange-500' : s.score >= 25 ? 'bg-yellow-500' : 'bg-green-500'
                      }`} style={{ width: `${s.score}%` }} />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-sm font-medium ${
                    s.trajectory === 'accelerating' ? 'text-red-600' : s.trajectory === 'declining' ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {s.trajectory === 'accelerating' ? '\u2191\u2191' : s.trajectory === 'declining' ? '\u2193' : '\u2192'} {s.trajectory}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-sm font-medium ${s.change.startsWith('+') ? 'text-red-600' : 'text-green-600'}`}>
                    {s.change}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-1 flex-wrap">
                    {Object.entries(s.domains).map(([domain, score]) => (
                      <span key={domain} className={`text-xs px-1.5 py-0.5 rounded ${
                        (score as number) >= 70 ? 'bg-red-100 text-red-700' : (score as number) >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {domain}: {score as number}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DistCard({ label, count, color }: { label: string; count: number; color: string }) {
  const colors: Record<string, string> = {
    red: 'border-l-red-500 text-red-600',
    orange: 'border-l-orange-500 text-orange-600',
    yellow: 'border-l-yellow-500 text-yellow-600',
    green: 'border-l-green-500 text-green-600',
  };
  return (
    <div className={`bg-white rounded-xl border border-gray-200 border-l-4 ${colors[color]} p-4`}>
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-3xl font-bold ${colors[color]?.split(' ')[1]}`}>{count}</div>
    </div>
  );
}
