export default function RiskScoresPage() {
  const mockSubjects = [
    { id: 'EMP-4821', type: 'employee', score: 91, trajectory: 'accelerating', domains: { finance: 88, security: 79, hr: 45 }, change: '+23', dept: 'Finance' },
    { id: 'EMP-9012', type: 'employee', score: 78, trajectory: 'accelerating', domains: { security: 85, communications: 62 }, change: '+15', dept: 'Engineering' },
    { id: 'EMP-1293', type: 'employee', score: 72, trajectory: 'stable', domains: { finance: 72, hr: 38 }, change: '+2', dept: 'Finance' },
    { id: 'EMP-3847', type: 'employee', score: 56, trajectory: 'accelerating', domains: { hr: 68, communications: 52, operations: 41 }, change: '+18', dept: 'Sales' },
    { id: 'BRANCH-12', type: 'department', score: 54, trajectory: 'stable', domains: { finance: 54, compliance: 48 }, change: '-3', dept: 'Branch Ops' },
    { id: 'EMP-2156', type: 'employee', score: 38, trajectory: 'declining', domains: { finance: 38 }, change: '-12', dept: 'Finance' },
    { id: 'EMP-7744', type: 'employee', score: 32, trajectory: 'stable', domains: { operations: 32, hr: 28 }, change: '+1', dept: 'IT' },
    { id: 'EMP-5500', type: 'employee', score: 18, trajectory: 'declining', domains: { communications: 18 }, change: '-8', dept: 'Marketing' },
  ];

  const distribution = { critical: 2, high: 2, medium: 2, low: 2 };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Risk Scores</h1>

      {/* Distribution */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <DistCard label="Critical (75+)" count={distribution.critical} color="red" />
        <DistCard label="High (50-74)" count={distribution.high} color="orange" />
        <DistCard label="Medium (25-49)" count={distribution.medium} color="yellow" />
        <DistCard label="Low (0-24)" count={distribution.low} color="green" />
      </div>

      {/* Risk Table */}
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
            {mockSubjects.map((s) => (
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
                        score >= 70 ? 'bg-red-100 text-red-700' : score >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {domain}: {score}
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
