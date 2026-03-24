import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">
            <span className="text-blue-600">Risks</span>RadarAI
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/#features" className="text-sm text-gray-600 hover:text-gray-900">Features</Link>
            <Link href="/#how-it-works" className="text-sm text-gray-600 hover:text-gray-900">How It Works</Link>
            <Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</Link>
            <a href="https://github.com/smaan712gb/RiskRadar" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-gray-900">GitHub</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium">Sign In</Link>
            <Link href="/signup" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-20 pb-32 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 rounded-full px-4 py-1.5 text-sm font-medium mb-8">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            Open Source — Apache 2.0 Licensed
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight max-w-4xl mx-auto">
            Detect compound risks
            <span className="text-blue-600"> before they become incidents</span>
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
            AI-powered risk intelligence that correlates signals across HR, finance, security, and operations. On your infrastructure. With regulator-ready evidence.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/signup" className="bg-blue-600 text-white px-8 py-3.5 rounded-lg text-base font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/25">
              Start Free Trial
            </Link>
            <a href="https://github.com/smaan712gb/RiskRadar" target="_blank" rel="noopener noreferrer" className="bg-gray-900 text-white px-8 py-3.5 rounded-lg text-base font-semibold hover:bg-gray-800 transition-colors">
              Self-Host Free
            </a>
          </div>
          <p className="mt-4 text-sm text-gray-500">14-day free trial. No credit card required. Deploy on-prem or cloud.</p>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-12 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm text-gray-500 mb-6">Built for regulated industries</p>
          <div className="flex items-center justify-center gap-12 text-gray-400 text-sm font-medium flex-wrap">
            <span>BSA/AML Compliant</span>
            <span>SOX Ready</span>
            <span>HIPAA Compatible</span>
            <span>GDPR Article 88</span>
            <span>EU AI Act Ready</span>
            <span>NIST CSF Aligned</span>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Your current tools are blind to compound risks</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">Each tool sees one domain. Nobody sees the pattern across domains.</p>
          </div>
          <div className="bg-gray-900 rounded-2xl p-8 md:p-12 text-white">
            <div className="grid md:grid-cols-5 gap-4 items-center">
              {[
                { day: 'Day 1', domain: 'HR', signal: 'Skips compliance training', color: 'border-green-500' },
                { day: 'Day 3', domain: 'Comms', signal: 'Slack activity drops 40%', color: 'border-yellow-500' },
                { day: 'Day 5', domain: 'Security', signal: 'After-hours data access', color: 'border-orange-500' },
                { day: 'Day 8', domain: 'Finance', signal: '3 override transactions', color: 'border-red-500' },
                { day: 'Day 10', domain: 'HR', signal: 'Peer interactions decline', color: 'border-red-500' },
              ].map((s) => (
                <div key={s.day} className={`bg-gray-800 rounded-lg p-4 border-l-4 ${s.color}`}>
                  <div className="text-xs text-gray-400">{s.day}</div>
                  <div className="text-xs text-blue-400 font-medium mt-1">{s.domain}</div>
                  <div className="text-sm mt-1">{s.signal}</div>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-8 border-t border-gray-700 text-center">
              <p className="text-gray-400 text-sm">Individual tools see 5 isolated low-priority events</p>
              <p className="text-xl font-bold text-red-400 mt-2">RisksRadarAI sees a HIGH-RISK compound pattern escalating over 10 days</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Built different from every competitor</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Cross-Domain Fusion', desc: 'Correlates signals across HR, finance, security, ops, and comms in real-time. No competitor does this.', icon: '\u{1F4CA}' },
              { title: 'On-Prem AI Reasoning', desc: 'Nemotron models run on your hardware. Gold-medal reasoning that never sends data off-premises.', icon: '\u{1F512}' },
              { title: 'Evidence Briefs', desc: 'Every alert includes AI-generated evidence chains with source citations and regulatory references.', icon: '\u{1F4CB}' },
              { title: 'Predictive Trajectories', desc: 'Projects risk forward. Know if someone will breach thresholds next week, not after the incident.', icon: '\u{1F4C8}' },
              { title: 'Auto-Learning', desc: 'System improves from every human review. Thresholds, patterns, and baselines adapt automatically.', icon: '\u{1F9E0}' },
              { title: 'Natural Language Policies', desc: 'Describe monitoring rules in plain English. AI translates to structured logic.', icon: '\u{1F4AC}' },
              { title: 'Regulatory Watchdog', desc: 'Scans 12+ regulatory sources every 6 hours. Auto-assesses impact on your monitoring.', icon: '\u{1F441}' },
              { title: 'SAR Auto-Draft', desc: 'Generates FinCEN-format Suspicious Activity Reports from evidence. BSA officers review and submit.', icon: '\u{1F4C4}' },
              { title: 'Deploy Anywhere', desc: 'Self-hosted, private cloud, managed SaaS, or hybrid. Your data stays where you decide.', icon: '\u{1F5A5}' },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-16">From installation to first alert in days, not months</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { num: 1, title: 'Deploy', desc: 'One-command install via Docker. Self-hosted or cloud. Connect to your infrastructure in minutes.' },
              { num: 2, title: 'Connect', desc: 'Pre-built integrations for SAP, Splunk, Workday, Azure AD, Slack, Jira, and 20+ systems.' },
              { num: 3, title: 'Monitor', desc: 'AI agents start analyzing signals immediately. No weeks of ML baselining needed.' },
              { num: 4, title: 'Act', desc: 'Review evidence briefs, escalate to cases, generate SARs, close the loop. Human-in-the-loop always.' },
            ].map((s) => (
              <div key={s.num} className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">{s.num}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Open source. Audit every line.</h2>
          <p className="text-xl text-gray-300 mb-8">
            Your compliance team can review exactly how we handle data. Your security team can verify there&apos;s no exfiltration. Your regulator can see the evidence trail.
          </p>
          <div className="flex items-center justify-center gap-4">
            <a href="https://github.com/smaan712gb/RiskRadar" target="_blank" rel="noopener noreferrer" className="bg-white text-gray-900 px-8 py-3.5 rounded-lg text-base font-semibold hover:bg-gray-100">
              View on GitHub
            </a>
            <Link href="/signup" className="bg-blue-600 text-white px-8 py-3.5 rounded-lg text-base font-semibold hover:bg-blue-700">
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <div className="space-y-2 text-sm">
                <div><Link href="/#features" className="hover:text-white">Features</Link></div>
                <div><Link href="/pricing" className="hover:text-white">Pricing</Link></div>
                <div><a href="https://github.com/smaan712gb/RiskRadar" className="hover:text-white">Open Source</a></div>
                <div><Link href="/overview" className="hover:text-white">Dashboard</Link></div>
              </div>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Deployment</h3>
              <div className="space-y-2 text-sm">
                <div>Self-Hosted</div><div>Private Cloud</div><div>Managed SaaS</div><div>Hybrid</div>
              </div>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <div className="space-y-2 text-sm">
                <div><a href="https://github.com/smaan712gb/RiskRadar" className="hover:text-white">Documentation</a></div>
                <div>API Reference</div><div>Blog</div><div>Compliance Guides</div>
              </div>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <div className="space-y-2 text-sm">
                <div><a href="https://aigovhub.io" className="hover:text-white">AIGovHub</a></div>
                <div>Contact</div><div>Terms of Service</div><div>Privacy Policy</div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 flex items-center justify-between flex-wrap gap-4">
            <p className="text-sm">2026 RisksRadarAI by AIGovHub. Apache 2.0 Open Source.</p>
            <p className="text-sm">Your data, your infrastructure, your control.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
