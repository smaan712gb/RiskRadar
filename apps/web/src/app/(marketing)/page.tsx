import Link from 'next/link';

export default function LandingPage() {
  return (
    <>
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
          <div className="flex items-center justify-center gap-12 text-gray-400 text-sm font-medium">
            <span>BSA/AML Compliant</span>
            <span>SOX Ready</span>
            <span>HIPAA Compatible</span>
            <span>GDPR Article 88</span>
            <span>EU AI Act Ready</span>
            <span>NIST CSF Aligned</span>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Your current tools are blind to compound risks</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">Each tool sees one domain. Nobody sees the pattern across domains.</p>
          </div>
          <div className="bg-gray-900 rounded-2xl p-8 md:p-12 text-white">
            <div className="grid md:grid-cols-5 gap-4 items-center">
              <Signal day="Day 1" domain="HR" signal="Skips compliance training" color="green" />
              <Signal day="Day 3" domain="Comms" signal="Slack activity drops 40%" color="yellow" />
              <Signal day="Day 5" domain="Security" signal="After-hours data access" color="orange" />
              <Signal day="Day 8" domain="Finance" signal="3 override transactions" color="red" />
              <Signal day="Day 10" domain="HR" signal="Peer interactions decline" color="red" />
            </div>
            <div className="mt-8 pt-8 border-t border-gray-700 text-center">
              <p className="text-gray-400 text-sm">Individual tools see 5 isolated low-priority events</p>
              <p className="text-xl font-bold text-red-400 mt-2">RiskRadar sees a HIGH-RISK compound pattern escalating over 10 days</p>
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
            <Feature title="Cross-Domain Fusion" desc="Correlates signals across HR, finance, security, ops, and comms in real-time. No competitor does this." icon="layers" />
            <Feature title="On-Prem AI Reasoning" desc="Nemotron models run on your hardware. Gold-medal reasoning that never sends data off-premises." icon="lock" />
            <Feature title="Evidence Briefs" desc="Every alert includes AI-generated evidence chains with source citations and regulatory references." icon="doc" />
            <Feature title="Predictive Trajectories" desc="Projects risk forward. Know if someone will breach thresholds next week, not after the incident." icon="trend" />
            <Feature title="Auto-Learning" desc="System improves from every human review. Thresholds, patterns, and baselines adapt automatically." icon="brain" />
            <Feature title="Natural Language Policies" desc="Describe monitoring rules in plain English. AI translates to structured logic." icon="chat" />
            <Feature title="Regulatory Watchdog" desc="Scans 12+ regulatory sources every 6 hours. Auto-assesses impact on your monitoring." icon="eye" />
            <Feature title="SAR Auto-Draft" desc="Generates FinCEN-format Suspicious Activity Reports from evidence. BSA officers review and submit." icon="file" />
            <Feature title="Deploy Anywhere" desc="Self-hosted, private cloud, managed SaaS, or hybrid. Your data stays where you decide." icon="server" />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-16">From installation to first alert in days, not months</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <Step num={1} title="Deploy" desc="One-command install via Docker. Self-hosted or cloud. Connect to your infrastructure in minutes." />
            <Step num={2} title="Connect" desc="Pre-built integrations for SAP, Splunk, Workday, Azure AD, Slack, Jira, and 20+ systems." />
            <Step num={3} title="Monitor" desc="AI agents start analyzing signals immediately. No weeks of ML baselining needed — reasoning models work from day one." />
            <Step num={4} title="Act" desc="Review evidence briefs, escalate to cases, generate SARs, close the loop. Human-in-the-loop always." />
          </div>
        </div>
      </section>

      {/* Open Source CTA */}
      <section className="py-24 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Open source. Audit every line.</h2>
          <p className="text-xl text-gray-300 mb-8">
            Your compliance team can review exactly how we handle data.
            Your security team can verify there&apos;s no exfiltration.
            Your regulator can see the evidence trail.
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
    </>
  );
}

function Signal({ day, domain, signal, color }: { day: string; domain: string; signal: string; color: string }) {
  const colors: Record<string, string> = { green: 'border-green-500', yellow: 'border-yellow-500', orange: 'border-orange-500', red: 'border-red-500' };
  return (
    <div className={`bg-gray-800 rounded-lg p-4 border-l-4 ${colors[color]}`}>
      <div className="text-xs text-gray-400">{day}</div>
      <div className="text-xs text-blue-400 font-medium mt-1">{domain}</div>
      <div className="text-sm mt-1">{signal}</div>
    </div>
  );
}

function Feature({ title, desc, icon }: { title: string; desc: string; icon: string }) {
  const icons: Record<string, string> = {
    layers: '\u{1F4CA}', lock: '\u{1F512}', doc: '\u{1F4CB}', trend: '\u{1F4C8}',
    brain: '\u{1F9E0}', chat: '\u{1F4AC}', eye: '\u{1F441}', file: '\u{1F4C4}', server: '\u{1F5A5}',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="text-2xl mb-3">{icons[icon]}</div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{desc}</p>
    </div>
  );
}

function Step({ num, title, desc }: { num: number; title: string; desc: string }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">{num}</div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{desc}</p>
    </div>
  );
}
