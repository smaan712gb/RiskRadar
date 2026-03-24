import Link from 'next/link';

export const metadata = { title: 'Contact — RisksRadarAI', description: 'Get in touch with the RisksRadarAI team.' };

export default function ContactPage() {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-black">Get In Touch</h1>
          <p className="mt-4 text-xl text-gray-500">Whether you want a demo, have questions, or need enterprise support.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center hover:shadow-lg transition">
            <div className="text-4xl mb-4">{'\u{1F4E7}'}</div>
            <h3 className="font-bold text-lg mb-2">General Inquiries</h3>
            <p className="text-sm text-gray-500 mb-4">Questions about the platform, pricing, or partnerships.</p>
            <a href="mailto:hello@aigovhub.io" className="text-blue-600 font-semibold text-sm hover:underline">hello@aigovhub.io</a>
          </div>

          <div className="bg-gradient-to-b from-blue-50 to-white rounded-2xl border-2 border-blue-200 p-8 text-center hover:shadow-lg transition">
            <div className="text-4xl mb-4">{'\u{1F4C5}'}</div>
            <h3 className="font-bold text-lg mb-2">Book a Demo</h3>
            <p className="text-sm text-gray-500 mb-4">See RisksRadarAI in action with your industry&apos;s use cases.</p>
            <a href="mailto:demo@aigovhub.io?subject=RisksRadarAI Demo Request" className="bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-blue-700 transition inline-block">Request Demo</a>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center hover:shadow-lg transition">
            <div className="text-4xl mb-4">{'\u{1F6E0}'}</div>
            <h3 className="font-bold text-lg mb-2">Enterprise & Support</h3>
            <p className="text-sm text-gray-500 mb-4">Dedicated support, custom deployments, and SLA agreements.</p>
            <a href="mailto:enterprise@aigovhub.io" className="text-blue-600 font-semibold text-sm hover:underline">enterprise@aigovhub.io</a>
          </div>
        </div>

        <div className="mt-16 text-center">
          <div className="bg-gray-50 rounded-2xl p-8 max-w-2xl mx-auto">
            <h3 className="font-bold text-lg mb-4">Open Source Community</h3>
            <p className="text-sm text-gray-600 mb-4">For technical questions, bug reports, and feature requests:</p>
            <a href="https://github.com/smaan712gb/RiskRadar" target="_blank" rel="noopener noreferrer" className="bg-gray-900 text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-gray-800 transition inline-block">GitHub Repository</a>
          </div>
        </div>
      </div>
    </section>
  );
}
