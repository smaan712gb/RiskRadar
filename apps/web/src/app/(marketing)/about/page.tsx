import Link from 'next/link';

export const metadata = { title: 'About — RisksRadarAI', description: 'The team and mission behind RisksRadarAI.' };

export default function AboutPage() {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-black mb-8">About RisksRadarAI</h1>

          <div className="space-y-8 text-gray-600">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
              <p className="text-lg leading-relaxed">We believe organizations should be able to detect compound risk patterns before they become incidents — without sending sensitive data to third parties, without waiting months for implementation, and without needing a $500K budget.</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">The Problem We Saw</h2>
              <p>After analyzing 23 enterprise risk platforms, we found the same problems everywhere: single-domain coverage that misses compound patterns, months-long deployments, black-box AI scores regulators can&apos;t audit, cloud-only architectures that force data off-premises, and pricing that excludes the mid-market.</p>
              <p className="mt-4">Banks with 200 employees face the same BSA/AML requirements as banks with 20,000 — but the tools built for the latter are priced at $67K-$500K per year. That gap is where compound risks hide and incidents happen.</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">What We Built</h2>
              <p>RisksRadarAI is the first cross-domain risk intelligence platform powered by on-premises reasoning AI. We fuse signals across HR, Finance, Security, Operations, and Communications to detect patterns that no single-domain tool can see.</p>
              <p className="mt-4">Every alert comes with a regulator-ready evidence brief — not an opaque risk score. Every agent runs in a sandboxed, deny-by-default environment. And the core platform is open source under Apache 2.0, so your compliance team can audit every line of code that touches your data.</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Part of AIGovHub</h2>
              <p>RisksRadarAI is built by <a href="https://aigovhub.io" className="text-blue-600 hover:underline">AIGovHub</a>, an AI governance and compliance platform. AIGovHub provides the governance layer for organizations deploying AI systems. RisksRadarAI extends that mission into continuous operational risk monitoring.</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Open Source Philosophy</h2>
              <p>We open-sourced the core platform because trust is non-negotiable in compliance technology. When a regulator asks &ldquo;how does your AI flag employees?&rdquo; — the answer should be auditable, not &ldquo;it&apos;s proprietary.&rdquo;</p>
              <p className="mt-4">The community edition is free to self-host forever. Enterprise features (auto-learning, SAR generation, regulatory watchdog) are available with a subscription that funds continued development.</p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8 mt-12">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Us</h2>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div><strong>General:</strong> <a href="mailto:hello@aigovhub.io" className="text-blue-600">hello@aigovhub.io</a></div>
                <div><strong>Enterprise:</strong> <a href="mailto:enterprise@aigovhub.io" className="text-blue-600">enterprise@aigovhub.io</a></div>
                <div><strong>Privacy:</strong> <a href="mailto:privacy@aigovhub.io" className="text-blue-600">privacy@aigovhub.io</a></div>
                <div><strong>GitHub:</strong> <a href="https://github.com/smaan712gb/RiskRadar" className="text-blue-600">smaan712gb/RiskRadar</a></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
