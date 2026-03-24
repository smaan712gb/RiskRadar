import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      {/* ═══ NAVIGATION ═══ */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="text-xl font-black tracking-tight">
            <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">Risks</span>
            <span className="text-gray-900">RadarAI</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm">
            <Link href="/#solutions" className="text-gray-500 hover:text-gray-900 transition">Solutions</Link>
            <Link href="/#platform" className="text-gray-500 hover:text-gray-900 transition">Platform</Link>
            <Link href="/#industries" className="text-gray-500 hover:text-gray-900 transition">Industries</Link>
            <Link href="/pricing" className="text-gray-500 hover:text-gray-900 transition">Pricing</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 font-medium transition">Sign In</Link>
            <Link href="/signup" className="bg-gradient-to-r from-blue-600 to-violet-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all">
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-violet-50 to-rose-50" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-violet-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur border border-gray-200/50 rounded-full px-4 py-1.5 text-sm font-medium mb-8 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-gray-600">Open Source</span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-600">Apache 2.0</span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-600">Self-Host Free</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black leading-[1.1] tracking-tight">
              The Risk Intelligence
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-rose-500 bg-clip-text text-transparent">
                Your Competitors Can&apos;t See
              </span>
            </h1>

            <p className="mt-8 text-xl md:text-2xl text-gray-500 max-w-3xl mx-auto leading-relaxed font-light">
              The only platform that fuses signals across <strong className="text-gray-900 font-semibold">HR, Finance, Security, Operations</strong> and <strong className="text-gray-900 font-semibold">Communications</strong> to detect compound risk patterns — weeks before they become incidents.
            </p>

            <div className="mt-12 flex items-center justify-center gap-4 flex-wrap">
              <Link href="/signup" className="group bg-gradient-to-r from-blue-600 to-violet-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-xl hover:shadow-blue-500/30 transition-all hover:-translate-y-0.5">
                Start 14-Day Free Trial
                <span className="ml-2 group-hover:ml-3 transition-all">{'\u2192'}</span>
              </Link>
              <a href="https://github.com/smaan712gb/RiskRadar" target="_blank" rel="noopener noreferrer" className="bg-gray-900 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-800 transition-all hover:-translate-y-0.5">
                View on GitHub
              </a>
            </div>

            <p className="mt-4 text-sm text-gray-400">No credit card required. Deploy on your infrastructure or ours.</p>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-20 relative mx-auto max-w-5xl">
            <div className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl p-1 shadow-2xl shadow-gray-900/20">
              <div className="bg-gray-900 rounded-xl p-6">
                <div className="flex gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                    <div className="text-xs text-gray-500">Active Alerts</div>
                    <div className="text-2xl font-bold text-red-400">23</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                    <div className="text-xs text-gray-500">Open Cases</div>
                    <div className="text-2xl font-bold text-orange-400">8</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                    <div className="text-xs text-gray-500">High Risk</div>
                    <div className="text-2xl font-bold text-yellow-400">12</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                    <div className="text-xs text-gray-500">Signals (24h)</div>
                    <div className="text-2xl font-bold text-blue-400">1,847</div>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {['Finance 520', 'Security 412', 'Operations 341', 'HR 289', 'Comms 285'].map((d) => {
                    const [name, val] = d.split(' ');
                    const pct = (parseInt(val!) / 600) * 100;
                    const colors = ['bg-blue-500', 'bg-red-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500'];
                    const i = ['Finance', 'Security', 'Operations', 'HR', 'Comms'].indexOf(name!);
                    return (
                      <div key={d} className="text-center">
                        <div className="text-[10px] text-gray-500 mb-1">{name}</div>
                        <div className="w-full bg-gray-800 rounded-full h-1.5">
                          <div className={`${colors[i]} rounded-full h-1.5`} style={{ width: `${pct}%` }} />
                        </div>
                        <div className="text-[10px] text-gray-600 mt-1">{val}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-gradient-to-b from-gray-900/10 to-transparent blur-xl" />
          </div>
        </div>
      </section>

      {/* ═══ TRUST BAR ═══ */}
      <section className="py-12 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-6">Compliance frameworks supported out of the box</p>
          <div className="flex items-center justify-center gap-8 md:gap-16 text-gray-300 text-sm font-semibold flex-wrap">
            {['BSA/AML', 'SOX', 'HIPAA', 'GDPR', 'EU AI Act', 'NIST CSF', 'PCI DSS', 'DORA'].map((f) => (
              <span key={f} className="hover:text-gray-500 transition">{f}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ THE PROBLEM ═══ */}
      <section className="py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-red-500 uppercase tracking-widest mb-3">The Problem</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">Every Tool Has a Blind Spot</h2>
            <p className="mt-4 text-xl text-gray-500 max-w-2xl mx-auto">Your SIEM sees security. Your ERP sees finance. Your HRIS sees HR. <strong className="text-gray-900">Nobody sees the compound pattern across all three.</strong></p>
          </div>

          <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-blue-950 rounded-3xl p-8 md:p-12 text-white shadow-2xl">
            <div className="grid md:grid-cols-5 gap-3">
              {[
                { day: 'Day 1', domain: 'HR', signal: 'Skips mandatory AML training', color: 'from-green-500/20 to-green-500/5', border: 'border-green-500/30' },
                { day: 'Day 3', domain: 'Comms', signal: 'Slack activity drops 40%', color: 'from-yellow-500/20 to-yellow-500/5', border: 'border-yellow-500/30' },
                { day: 'Day 5', domain: 'Security', signal: 'After-hours data access at 11:47 PM', color: 'from-orange-500/20 to-orange-500/5', border: 'border-orange-500/30' },
                { day: 'Day 8', domain: 'Finance', signal: '3 wire overrides during supervisor PTO', color: 'from-red-500/20 to-red-500/5', border: 'border-red-500/30' },
                { day: 'Day 10', domain: 'HR', signal: 'Peer interactions drop 60%', color: 'from-red-500/20 to-red-500/5', border: 'border-red-600/30' },
              ].map((s) => (
                <div key={s.day} className={`bg-gradient-to-b ${s.color} rounded-xl p-4 border ${s.border} backdrop-blur`}>
                  <div className="text-[10px] text-gray-400 font-mono">{s.day}</div>
                  <div className="text-xs text-blue-400 font-bold mt-1">{s.domain}</div>
                  <div className="text-sm mt-2 text-gray-200">{s.signal}</div>
                </div>
              ))}
            </div>
            <div className="mt-10 grid md:grid-cols-2 gap-8 text-center pt-8 border-t border-white/10">
              <div className="bg-white/5 rounded-2xl p-6">
                <div className="text-gray-400 text-sm mb-2">What your current tools report:</div>
                <div className="text-xl font-medium text-gray-300">&ldquo;5 unrelated low-priority events&rdquo;</div>
              </div>
              <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-2xl p-6 border border-red-500/20">
                <div className="text-red-400 text-sm mb-2">What RisksRadarAI detects:</div>
                <div className="text-xl font-bold text-white">Compound Risk Score: 91/100</div>
                <div className="text-sm text-red-300 mt-1">Insider threat pattern escalating over 10 days</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ THREE PRODUCTS ═══ */}
      <section id="solutions" className="py-28 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">Solutions</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">Three Products. One Platform.</h2>
            <p className="mt-4 text-xl text-gray-500">Everything you need to detect, investigate, and respond to organizational risk.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '\u{1F6E1}', gradient: 'from-red-500 to-orange-500', bg: 'bg-red-50', border: 'border-red-100',
                title: 'Risk Detection & Fusion',
                subtitle: 'Cross-domain AI that sees what others miss',
                features: [
                  '33 signal types across 7 risk domains',
                  'Compound risk scoring with chain-of-thought AI',
                  'Predictive trajectories with projected breach dates',
                  'Digital twin baselines per role archetype',
                  'Auto-learning from every human review',
                  'Benford\'s Law, structuring, override forensics',
                ],
              },
              {
                icon: '\u{1F4CB}', gradient: 'from-blue-500 to-violet-500', bg: 'bg-blue-50', border: 'border-blue-100',
                title: 'Investigation & Compliance',
                subtitle: 'From alert to SAR filing in minutes, not days',
                features: [
                  'Evidence briefs with source citations & reasoning',
                  'Case management with SLA tracking',
                  'Auto SAR/STR draft generation (FinCEN format)',
                  'Regulatory knowledge engine (BSA, SOX, HIPAA, GDPR)',
                  'Natural language policy builder',
                  'Immutable audit trail for regulatory exams',
                ],
              },
              {
                icon: '\u{1F916}', gradient: 'from-violet-500 to-purple-500', bg: 'bg-violet-50', border: 'border-violet-100',
                title: 'AI Agent Operations',
                subtitle: '12 specialized agents with PhD-level expertise',
                features: [
                  'Always-on regulatory watchdog (12 sources, every 6h)',
                  'Transaction forensics (CFE/CAMS-level analysis)',
                  'Insider threat detection (CERT/CC + MITRE ATT&CK)',
                  'Workforce behavioral analytics (I/O Psychology)',
                  'NemoClaw sandboxed execution (deny-by-default)',
                  '20+ pre-built enterprise integrations',
                ],
              },
            ].map((p) => (
              <div key={p.title} className={`${p.bg} rounded-2xl border ${p.border} p-8 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300`}>
                <div className={`w-14 h-14 bg-gradient-to-br ${p.gradient} rounded-2xl flex items-center justify-center text-2xl text-white shadow-lg mb-6`}>
                  {p.icon}
                </div>
                <h3 className="text-xl font-bold mb-1">{p.title}</h3>
                <p className="text-sm text-gray-500 mb-6">{p.subtitle}</p>
                <ul className="space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
                      <span className="text-green-500 mt-0.5 font-bold">{'\u2713'}</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PLATFORM / HOW IT WORKS ═══ */}
      <section id="platform" className="py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-violet-600 uppercase tracking-widest mb-3">Platform</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">From Install to First Alert in Days</h2>
            <p className="mt-4 text-xl text-gray-500">Not months. Not weeks. Days. No ML baselining period required.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-0">
            {[
              { num: '01', title: 'Deploy', desc: 'One-command Docker install on your infrastructure. Or use our managed cloud. Self-hosted is free forever.', color: 'text-blue-600' },
              { num: '02', title: 'Connect', desc: 'Pre-built connectors for SAP, Splunk, Workday, Azure AD, Slack, Jira, and 20+ enterprise systems.', color: 'text-violet-600' },
              { num: '03', title: 'Monitor', desc: '12 AI agents with PhD-level expertise start analyzing signals immediately. No training period needed.', color: 'text-purple-600' },
              { num: '04', title: 'Act', desc: 'Review evidence briefs, escalate to cases, auto-generate SARs. Human-in-the-loop at every decision.', color: 'text-rose-600' },
            ].map((s, i) => (
              <div key={s.num} className="relative p-8 text-center group">
                {i < 3 && <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-8 text-gray-200 text-2xl">{'\u2192'}</div>}
                <div className={`text-5xl font-black ${s.color} opacity-20 mb-4`}>{s.num}</div>
                <h3 className="text-lg font-bold mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ VS COMPETITORS ═══ */}
      <section className="py-28 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-blue-400 uppercase tracking-widest mb-3">Why Switch</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">We Solve What Others Can&apos;t</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { problem: 'Months-long deployment', fix: 'First alerts in days — no ML baselining', icon: '\u{26A1}' },
              { problem: 'False positive overload', fix: 'Cross-domain correlation cuts noise 80%+', icon: '\u{1F3AF}' },
              { problem: 'Single-domain blind spots', fix: 'Fuses HR + Finance + Security + Ops + Comms', icon: '\u{1F310}' },
              { problem: 'Black-box AI scores', fix: 'Chain-of-thought evidence briefs with citations', icon: '\u{1F4A1}' },
              { problem: 'Cloud-only (data leaves)', fix: 'On-premises AI via NemoClaw. Zero data egress.', icon: '\u{1F512}' },
              { problem: '$67K-$500K+ per year', fix: 'Open-source core is free. Enterprise from $2.5K/mo', icon: '\u{1F4B0}' },
            ].map((d) => (
              <div key={d.problem} className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-blue-500/30 transition-all group">
                <div className="text-3xl mb-4">{d.icon}</div>
                <div className="text-sm text-red-400/80 line-through mb-2">{d.problem}</div>
                <div className="text-base text-white font-semibold">{d.fix}</div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 pt-12 border-t border-white/10">
            {[
              { value: '$6.9M', label: 'Avg insider threat cost', sub: 'IBM/Ponemon' },
              { value: '91%', label: 'Alert precision target', sub: 'Compound scoring' },
              { value: '2 days', label: 'Time to first alert', sub: 'Not months' },
              { value: '38-72x', label: 'ROI per incident prevented', sub: 'Vs. platform cost' },
            ].map((s) => (
              <div key={s.value} className="text-center">
                <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">{s.value}</div>
                <div className="text-sm text-gray-300 mt-2">{s.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ INDUSTRIES ═══ */}
      <section id="industries" className="py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-green-600 uppercase tracking-widest mb-3">Industries</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">Purpose-Built for Regulated Industries</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '\u{1F3E6}', industry: 'Banking & Credit Unions', regs: 'BSA/AML, SOX, GLBA, OCC, FDIC',
                cases: ['Transaction override forensics', 'Automated SAR draft generation', 'Structuring/smurfing detection', 'Insider threat during supervisor absence', 'Compliance training gap monitoring'],
              },
              {
                icon: '\u{1F3E5}', industry: 'Healthcare', regs: 'HIPAA, HITECH, SOX, NIST',
                cases: ['PHI access anomaly detection', 'Breach indicator monitoring', 'Billing fraud pattern analysis', 'Workforce burnout prediction', 'Credential abuse detection'],
              },
              {
                icon: '\u{1F4C8}', industry: 'Insurance & Finance', regs: 'SOX, DORA, GDPR, PCI DSS',
                cases: ['Claims fraud correlation', 'Vendor risk monitoring', 'Regulatory change auto-tracking', 'Data exfiltration prevention', 'Operational resilience monitoring'],
              },
            ].map((ind) => (
              <div key={ind.industry} className="group rounded-2xl border border-gray-200 p-8 hover:shadow-xl hover:border-gray-300 transition-all duration-300">
                <div className="text-4xl mb-4">{ind.icon}</div>
                <h3 className="text-xl font-bold mb-1">{ind.industry}</h3>
                <p className="text-xs text-blue-600 font-semibold mb-6">{ind.regs}</p>
                <ul className="space-y-2.5">
                  {ind.cases.map((c) => (
                    <li key={c} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-green-500 mt-0.5">{'\u2713'}</span>{c}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ DEPLOYMENT OPTIONS ═══ */}
      <section className="py-28 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-orange-600 uppercase tracking-widest mb-3">Deployment</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">Your Data. Your Rules.</h2>
            <p className="mt-4 text-xl text-gray-500">Four deployment modes. You choose where your data lives.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { title: 'Self-Hosted', desc: 'Everything on your hardware. 100% air-gapped. Free forever.', icon: '\u{1F5A5}', badge: 'Free', highlight: true },
              { title: 'Private Cloud', desc: 'Your AWS, GCP, or Azure account. Your VPC.', icon: '\u2601', badge: 'All Plans', highlight: false },
              { title: 'Managed SaaS', desc: 'We host it. You focus on risk, not infrastructure.', icon: '\u{1F310}', badge: 'Pro+', highlight: false },
              { title: 'Hybrid', desc: 'Dashboard in cloud. AI reasoning stays on your premises.', icon: '\u{1F500}', badge: 'Enterprise', highlight: false },
            ].map((d) => (
              <div key={d.title} className={`rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-1 ${d.highlight ? 'bg-gradient-to-b from-blue-600 to-violet-600 text-white shadow-xl shadow-blue-500/20' : 'bg-white border border-gray-200 hover:shadow-lg'}`}>
                <div className="text-4xl mb-4">{d.icon}</div>
                <h3 className="text-lg font-bold mb-2">{d.title}</h3>
                <p className={`text-sm mb-4 ${d.highlight ? 'text-blue-100' : 'text-gray-500'}`}>{d.desc}</p>
                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${d.highlight ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>{d.badge}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-28">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
            Ready to See What You&apos;ve Been Missing?
          </h2>
          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
            Start detecting compound risk patterns in days, not months. Open source. Audit every line. Your data never leaves your network.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/signup" className="group bg-gradient-to-r from-blue-600 to-violet-600 text-white px-10 py-4 rounded-full text-lg font-semibold hover:shadow-xl hover:shadow-blue-500/30 transition-all hover:-translate-y-0.5">
              Start Free Trial
              <span className="ml-2 group-hover:ml-3 transition-all">{'\u2192'}</span>
            </Link>
            <Link href="/pricing" className="bg-white text-gray-900 px-10 py-4 rounded-full text-lg font-semibold border-2 border-gray-200 hover:border-gray-400 transition-all">
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-gray-950 text-gray-400 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="text-lg font-black mb-4">
                <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">Risks</span>
                <span className="text-white">RadarAI</span>
              </div>
              <p className="text-sm text-gray-500">AI-powered risk intelligence for regulated industries.</p>
              <p className="text-xs text-gray-600 mt-4">A product by <a href="https://aigovhub.io" className="text-blue-400 hover:text-blue-300">AIGovHub</a></p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4 text-sm">Solutions</h3>
              <div className="space-y-2 text-sm">
                <div><Link href="/#solutions" className="hover:text-white transition">Risk Detection</Link></div>
                <div><Link href="/#solutions" className="hover:text-white transition">Investigation</Link></div>
                <div><Link href="/#solutions" className="hover:text-white transition">AI Agents</Link></div>
                <div><Link href="/pricing" className="hover:text-white transition">Pricing</Link></div>
              </div>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4 text-sm">Industries</h3>
              <div className="space-y-2 text-sm">
                <div>Banking</div><div>Healthcare</div><div>Insurance</div><div>Manufacturing</div>
              </div>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4 text-sm">Resources</h3>
              <div className="space-y-2 text-sm">
                <div><a href="https://github.com/smaan712gb/RiskRadar" className="hover:text-white transition">GitHub</a></div>
                <div><Link href="/overview" className="hover:text-white transition">Dashboard</Link></div>
                <div><a href="/api/v1/docs" class="hover:text-white transition">API Docs</a></div><div><a href="/about" class="hover:text-white transition">About</a></div>
              </div>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4 text-sm">Company</h3>
              <div className="space-y-2 text-sm">
                <div><a href="https://aigovhub.io" className="hover:text-white transition">AIGovHub</a></div>
                <div><a href="/contact" class="hover:text-white transition">Contact</a></div><div><a href="/terms" class="hover:text-white transition">Terms</a></div><div><a href="/privacy" class="hover:text-white transition">Privacy</a></div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-16 pt-8 flex items-center justify-between flex-wrap gap-4">
            <p className="text-xs text-gray-600">2026 RisksRadarAI. Apache 2.0 Open Source.</p>
            <p className="text-xs text-gray-600">Your data. Your infrastructure. Your control.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
