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
            <Link href="/#solutions" className="text-sm text-gray-600 hover:text-gray-900">Solutions</Link>
            <Link href="/#products" className="text-sm text-gray-600 hover:text-gray-900">Products</Link>
            <Link href="/#industries" className="text-sm text-gray-600 hover:text-gray-900">Industries</Link>
            <Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</Link>
            <a href="https://github.com/smaan712gb/RiskRadar" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-gray-900">Open Source</a>
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
      <section className="pt-20 pb-24 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 rounded-full px-4 py-1.5 text-sm font-medium mb-8">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            Open Source — Apache 2.0 Licensed | Self-Host Free
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight max-w-5xl mx-auto">
            AI-Powered Risk Intelligence
            <span className="text-blue-600"> That Catches What Others Miss</span>
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            The only platform that correlates signals across <strong>HR, Finance, Security, Operations, and Communications</strong> to detect compound risk patterns weeks before they become incidents. On-premises AI. Regulator-ready evidence. Your data never leaves your network.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
            <Link href="/signup" className="bg-blue-600 text-white px-8 py-3.5 rounded-lg text-base font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/25">
              Start 14-Day Free Trial
            </Link>
            <Link href="/pricing" className="bg-white text-gray-900 px-8 py-3.5 rounded-lg text-base font-semibold border border-gray-300 hover:border-gray-400 transition-colors">
              View Pricing
            </Link>
            <a href="https://github.com/smaan712gb/RiskRadar" target="_blank" rel="noopener noreferrer" className="bg-gray-900 text-white px-8 py-3.5 rounded-lg text-base font-semibold hover:bg-gray-800 transition-colors">
              Self-Host Free
            </a>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-sm text-gray-500 uppercase tracking-wide font-medium">Built for compliance-driven organizations</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-6 text-center">
            {[
              { icon: '\u{1F3E6}', label: 'Banks & Credit Unions' },
              { icon: '\u{1F3E5}', label: 'Healthcare Systems' },
              { icon: '\u{1F4CA}', label: 'Insurance Companies' },
              { icon: '\u{1F3ED}', label: 'Manufacturing' },
              { icon: '\u{1F4BB}', label: 'Technology' },
              { icon: '\u{1F3DB}', label: 'Government' },
            ].map((i) => (
              <div key={i.label} className="flex flex-col items-center gap-2">
                <span className="text-3xl">{i.icon}</span>
                <span className="text-xs text-gray-600 font-medium">{i.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Your Current Tools Have Blind Spots</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">Each tool monitors one domain. Nobody connects the dots across domains. That&apos;s where compound risks hide.</p>
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
            <div className="mt-8 pt-8 border-t border-gray-700 grid md:grid-cols-2 gap-8 text-center">
              <div>
                <p className="text-gray-400 text-sm mb-2">What competitors see:</p>
                <p className="text-lg font-medium text-gray-300">5 separate low-priority events</p>
              </div>
              <div>
                <p className="text-blue-400 text-sm mb-2">What RisksRadarAI sees:</p>
                <p className="text-lg font-bold text-red-400">1 HIGH-RISK compound pattern escalating over 10 days</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions / Products */}
      <section id="solutions" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Three Products. One Platform.</h2>
            <p className="mt-4 text-lg text-gray-600">Everything you need to detect, investigate, and respond to organizational risk.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Product 1 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center text-2xl mb-6">{'\u{1F6E1}'}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Risk Detection & Fusion</h3>
              <p className="text-gray-600 text-sm mb-6">Cross-domain AI that correlates signals across HR, Finance, Security, Operations, and Communications to detect compound risk patterns no single tool can see.</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">{'\u2713'}</span> 33 signal types across 7 risk domains</li>
                <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">{'\u2713'}</span> Compound risk scoring with AI reasoning</li>
                <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">{'\u2713'}</span> Predictive risk trajectories (projected breach dates)</li>
                <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">{'\u2713'}</span> Digital twin behavioral baselines per role</li>
                <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">{'\u2713'}</span> Auto-learning from human feedback</li>
              </ul>
            </div>

            {/* Product 2 */}
            <div className="bg-white rounded-2xl border border-blue-200 p-8 hover:shadow-xl transition-shadow ring-2 ring-blue-100">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-2xl mb-6">{'\u{1F4CB}'}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Investigation & Compliance</h3>
              <p className="text-gray-600 text-sm mb-6">AI-generated evidence briefs, case management, automated SAR/STR drafting, and regulatory mapping — everything your compliance team needs.</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">{'\u2713'}</span> Evidence briefs with source citations</li>
                <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">{'\u2713'}</span> Case management with SLA tracking</li>
                <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">{'\u2713'}</span> Auto SAR/STR draft generation (FinCEN format)</li>
                <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">{'\u2713'}</span> Regulatory knowledge engine (BSA/AML, SOX, HIPAA, GDPR)</li>
                <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">{'\u2713'}</span> Immutable audit trail for examinations</li>
              </ul>
            </div>

            {/* Product 3 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center text-2xl mb-6">{'\u{1F916}'}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">AI Agent Monitoring</h3>
              <p className="text-gray-600 text-sm mb-6">12 specialized AI agents running 24/7 with PhD-level expertise in financial forensics, insider threat detection, workforce analytics, and regulatory compliance.</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">{'\u2713'}</span> Always-on regulatory watchdog (scans 12 sources every 6h)</li>
                <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">{'\u2713'}</span> Natural language policy builder</li>
                <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">{'\u2713'}</span> NemoClaw sandboxed execution (deny-by-default)</li>
                <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">{'\u2713'}</span> On-premises AI (data never leaves your network)</li>
                <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">{'\u2713'}</span> 20+ pre-built enterprise integrations</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Key Differentiators */}
      <section id="products" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Why Teams Switch to RisksRadarAI</h2>
            <p className="mt-4 text-lg text-gray-600">We solve the 7 problems every competitor has.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { problem: 'Months-long deployment', solution: 'First alerts in days — reasoning models work from day one, no ML baselining', icon: '\u{26A1}' },
              { problem: 'False positive overload', solution: 'Multi-signal correlation + adaptive thresholds reduce noise by 80%+', icon: '\u{1F3AF}' },
              { problem: 'Single-domain coverage', solution: 'Cross-domain fusion across HR + Finance + Security + Ops + Communications', icon: '\u{1F310}' },
              { problem: 'Opaque AI decisions', solution: 'Chain-of-thought evidence briefs with source citations your regulator can audit', icon: '\u{1F4A1}' },
              { problem: 'Cloud-only (data leaves network)', solution: 'On-premises AI via NemoClaw — your data, your infrastructure, always', icon: '\u{1F512}' },
              { problem: 'Enterprise-only pricing ($67K-$500K+)', solution: 'Open-source core is free. Enterprise starts at $2,500/month', icon: '\u{1F4B0}' },
            ].map((d) => (
              <div key={d.problem} className="flex gap-4 p-6 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                <div className="text-3xl flex-shrink-0">{d.icon}</div>
                <div>
                  <div className="text-sm text-red-500 font-medium line-through mb-1">{d.problem}</div>
                  <div className="text-sm text-gray-900 font-medium">{d.solution}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries */}
      <section id="industries" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Purpose-Built for Regulated Industries</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                industry: 'Banking & Credit Unions',
                icon: '\u{1F3E6}',
                regulations: 'BSA/AML, SOX, GLBA, OCC, FDIC',
                useCases: ['Transaction override monitoring', 'SAR auto-generation', 'Insider threat detection', 'Compliance training tracking', 'Structuring/smurfing detection'],
              },
              {
                industry: 'Healthcare',
                icon: '\u{1F3E5}',
                regulations: 'HIPAA, HITECH, SOX, NIST',
                useCases: ['PHI access monitoring', 'Breach detection', 'Employee credential abuse', 'Billing fraud patterns', 'Workforce burnout prediction'],
              },
              {
                industry: 'Insurance & Financial Services',
                icon: '\u{1F4C8}',
                regulations: 'SOX, DORA, GDPR, PCI DSS',
                useCases: ['Claims fraud detection', 'Vendor risk monitoring', 'Regulatory change tracking', 'Operational risk analytics', 'Data exfiltration prevention'],
              },
            ].map((ind) => (
              <div key={ind.industry} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="text-3xl mb-3">{ind.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{ind.industry}</h3>
                <p className="text-xs text-blue-600 font-medium mb-4">{ind.regulations}</p>
                <ul className="space-y-1.5">
                  {ind.useCases.map((uc) => (
                    <li key={uc} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-green-500 mt-0.5 flex-shrink-0">{'\u2713'}</span>
                      {uc}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">From Install to First Alert in Days</h2>
          <p className="text-center text-gray-600 mb-16">Not months. Not weeks. Days.</p>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { num: 1, title: 'Deploy', desc: 'One-command Docker install on your infrastructure. Or use our managed cloud. Your choice.' },
              { num: 2, title: 'Connect', desc: 'Pre-built connectors for SAP, Splunk, Workday, Azure AD, Slack, Jira, and 20+ systems.' },
              { num: 3, title: 'Monitor', desc: '12 AI agents start analyzing signals immediately. No ML baselining period needed.' },
              { num: 4, title: 'Act', desc: 'Review evidence briefs, escalate to cases, generate SARs. Human-in-the-loop always.' },
            ].map((s) => (
              <div key={s.num} className="text-center">
                <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-4">{s.num}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Deployment Options */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Deploy Your Way. Your Data. Your Control.</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { title: 'Self-Hosted', desc: 'Everything on your hardware. 100% air-gapped. Free forever.', icon: '\u{1F5A5}', badge: 'Free' },
              { title: 'Private Cloud', desc: 'Your AWS, GCP, or Azure account. Your VPC.', icon: '\u2601', badge: 'All Plans' },
              { title: 'Managed SaaS', desc: 'We host it. You focus on risk.', icon: '\u{1F310}', badge: 'Pro+' },
              { title: 'Hybrid', desc: 'Dashboard in cloud. AI stays on your premises.', icon: '\u{1F500}', badge: 'Enterprise' },
            ].map((d) => (
              <div key={d.title} className="bg-white rounded-xl border border-gray-200 p-6 text-center hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">{d.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{d.title}</h3>
                <p className="text-xs text-gray-500 mb-3">{d.desc}</p>
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{d.badge}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats / Social Proof */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-400">$6.9M</div>
              <div className="text-sm text-gray-400 mt-1">Avg insider threat cost (IBM)</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-400">91%</div>
              <div className="text-sm text-gray-400 mt-1">Alert precision target</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-400">2 days</div>
              <div className="text-sm text-gray-400 mt-1">Time to first alert</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-400">38-72x</div>
              <div className="text-sm text-gray-400 mt-1">ROI if 1 incident prevented</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Open Source. Audit Every Line.</h2>
          <p className="text-lg text-gray-600 mb-8">
            Your compliance team can review exactly how we handle data. Your security team can verify there&apos;s no exfiltration. Your regulator can see the evidence trail.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/signup" className="bg-blue-600 text-white px-8 py-3.5 rounded-lg text-base font-semibold hover:bg-blue-700 shadow-lg shadow-blue-600/25">
              Start Free Trial
            </Link>
            <Link href="/pricing" className="bg-white text-gray-900 px-8 py-3.5 rounded-lg text-base font-semibold border border-gray-300 hover:border-gray-400">
              View Pricing
            </Link>
            <a href="https://github.com/smaan712gb/RiskRadar" target="_blank" rel="noopener noreferrer" className="bg-gray-900 text-white px-8 py-3.5 rounded-lg text-base font-semibold hover:bg-gray-800">
              GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="text-white font-bold text-lg mb-4"><span className="text-blue-400">Risks</span>RadarAI</div>
              <p className="text-sm">AI-powered risk intelligence for regulated industries.</p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <div className="space-y-2 text-sm">
                <div><Link href="/#solutions" className="hover:text-white">Solutions</Link></div>
                <div><Link href="/pricing" className="hover:text-white">Pricing</Link></div>
                <div><Link href="/overview" className="hover:text-white">Dashboard</Link></div>
                <div><a href="https://github.com/smaan712gb/RiskRadar" className="hover:text-white">Open Source</a></div>
              </div>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Industries</h3>
              <div className="space-y-2 text-sm">
                <div>Banking</div><div>Healthcare</div><div>Insurance</div><div>Manufacturing</div>
              </div>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <div className="space-y-2 text-sm">
                <div><a href="https://github.com/smaan712gb/RiskRadar" className="hover:text-white">Documentation</a></div>
                <div>API Reference</div><div>Compliance Guides</div><div>Blog</div>
              </div>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <div className="space-y-2 text-sm">
                <div><a href="https://aigovhub.io" className="hover:text-white">AIGovHub</a></div>
                <div>Contact</div><div>Terms</div><div>Privacy</div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 flex items-center justify-between flex-wrap gap-4">
            <p className="text-sm">2026 RisksRadarAI — A product by <a href="https://aigovhub.io" className="text-blue-400 hover:text-blue-300">AIGovHub</a></p>
            <p className="text-sm">Your data. Your infrastructure. Your control.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
