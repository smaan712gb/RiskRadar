import Link from 'next/link';

export const metadata = { title: 'Privacy Policy — RisksRadarAI', description: 'How RisksRadarAI handles your data. Privacy-first by design.' };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 bg-white/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="text-xl font-black"><span className="text-blue-600">Risks</span>RadarAI</Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">Back to Home</Link>
        </div>
      </nav>
      <div className="max-w-3xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-black mb-8">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-12">Last updated: March 24, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-600">
          <section>
            <h2 className="text-xl font-bold text-gray-900">Our Privacy Commitment</h2>
            <p>RisksRadarAI is built on a fundamental principle: <strong>your data belongs to you</strong>. We designed every aspect of our platform — from self-hosted deployment to on-premises AI inference — to ensure organizations maintain complete control over their sensitive data.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">Data We Collect</h2>
            <h3 className="font-semibold text-gray-800">For Self-Hosted Customers</h3>
            <p>We collect <strong>zero data</strong> from your deployment. Everything runs on your infrastructure. We have no access to your signals, alerts, cases, or any organizational data.</p>
            <h3 className="font-semibold text-gray-800">For Managed SaaS Customers</h3>
            <p>We process the data you connect through integrations (HR metadata, financial transaction logs, security events, communication metadata). This data is stored in your dedicated, isolated tenant environment. We never access customer data without explicit written authorization.</p>
            <h3 className="font-semibold text-gray-800">For All Visitors</h3>
            <p>Our marketing website collects standard analytics (page views, referral source) via privacy-respecting analytics. We do not use third-party tracking pixels or sell visitor data.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">AI & Data Processing</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Local inference mode:</strong> All AI processing happens on your hardware. No data is transmitted to external services.</li>
              <li><strong>Cloud inference mode:</strong> Queries to external AI APIs are stripped of PII before transmission via the Privacy Router.</li>
              <li><strong>Hybrid mode:</strong> Routine analysis uses cloud APIs (PII-stripped). Deep reasoning stays local.</li>
              <li><strong>Communication monitoring:</strong> We analyze metadata only (frequency, timing, response latency). We never read message content.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">Data Retention</h2>
            <p>Configurable per tenant. Default: 365 days for signals, 7 years for audit logs (BSA/AML requirement). Automated purging with audit proof.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">GDPR, HIPAA, and Regulatory Compliance</h2>
            <p>RisksRadarAI supports GDPR Article 88 (employee data in employment context), HIPAA (on-premises deployment for PHI), and CCPA/CPRA data subject rights. For self-hosted deployments, you are the data controller and processor.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">Contact</h2>
            <p>Privacy inquiries: <a href="mailto:privacy@aigovhub.io" className="text-blue-600">privacy@aigovhub.io</a></p>
          </section>
        </div>
      </div>
    </div>
  );
}
