export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left: Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-900 text-white flex-col justify-between p-12">
        <div>
          <h1 className="text-3xl font-bold">
            <span className="text-blue-400">Risk</span>Radar
          </h1>
          <p className="text-blue-200 mt-1 text-sm">AI Risk Intelligence Platform</p>
        </div>
        <div>
          <blockquote className="text-xl font-light leading-relaxed text-blue-100">
            &ldquo;RiskRadar caught a compound fraud pattern across three departments that our
            existing tools completely missed. The evidence brief was so detailed our regulator
            asked how we built it.&rdquo;
          </blockquote>
          <div className="mt-4">
            <div className="font-semibold">Sarah Chen</div>
            <div className="text-blue-300 text-sm">Chief Compliance Officer, Pacific Community Bank</div>
          </div>
        </div>
        <div className="flex gap-8 text-sm text-blue-300">
          <div><span className="text-2xl font-bold text-white">91%</span><br />Alert Precision</div>
          <div><span className="text-2xl font-bold text-white">2 days</span><br />Time to First Alert</div>
          <div><span className="text-2xl font-bold text-white">$6.9M</span><br />Avg. Incident Cost Avoided</div>
        </div>
      </div>

      {/* Right: Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
