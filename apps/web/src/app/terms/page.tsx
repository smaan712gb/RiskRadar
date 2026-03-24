import Link from 'next/link';

export const metadata = { title: 'Terms of Service — RisksRadarAI', description: 'Terms of service for the RisksRadarAI platform.' };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 bg-white/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="text-xl font-black"><span className="text-blue-600">Risks</span>RadarAI</Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">Back to Home</Link>
        </div>
      </nav>
      <div className="max-w-3xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-black mb-8">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-12">Last updated: March 24, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-600">
          <section>
            <h2 className="text-xl font-bold text-gray-900">1. Acceptance</h2>
            <p>By using RisksRadarAI (&ldquo;the Platform&rdquo;), operated by AIGovHub (&ldquo;we&rdquo;, &ldquo;us&rdquo;), you agree to these terms. The Platform includes the self-hosted open-source edition and the managed SaaS offering.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">2. Open Source License</h2>
            <p>The RisksRadarAI core platform is licensed under Apache 2.0. You may use, modify, and distribute the open-source components in accordance with the Apache 2.0 license. Enterprise features are subject to a separate commercial license.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">3. Managed Service</h2>
            <p>For managed SaaS customers, we provide hosting, maintenance, and support. We target 99.9% uptime for the managed service. Planned maintenance windows are communicated 48 hours in advance.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">4. Data Ownership</h2>
            <p>You retain full ownership of all data processed by the Platform. We do not claim any rights to your organizational data. For self-hosted deployments, your data never leaves your infrastructure.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">5. Acceptable Use</h2>
            <p>The Platform is designed for organizational risk monitoring and compliance. You agree not to use it for: surveillance without proper legal basis, discriminatory profiling based on protected characteristics, or any purpose that violates applicable employment or privacy laws.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">6. Limitation of Liability</h2>
            <p>RisksRadarAI provides risk intelligence to support human decision-making. AI-generated alerts, evidence briefs, and recommendations are advisory only. All consequential decisions (personnel actions, regulatory filings, access restrictions) must be reviewed and approved by authorized human personnel.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">7. Contact</h2>
            <p>Legal inquiries: <a href="mailto:legal@aigovhub.io" className="text-blue-600">legal@aigovhub.io</a></p>
          </section>
        </div>
      </div>
    </div>
  );
}
