import Link from 'next/link';

const plans = [
  {
    name: 'Community',
    price: 'Free',
    period: 'forever',
    description: 'Self-hosted open source. Full core platform.',
    cta: 'Deploy Free',
    ctaHref: 'https://github.com/smaan712gb/RiskRadar',
    highlight: false,
    features: [
      'Unlimited signals & alerts',
      'All 5 collection agents',
      'Cross-domain fusion engine',
      'Risk trajectory analysis',
      'Evidence brief generation',
      'Case management',
      '7 expert AI skills',
      'Full audit logging',
      '45+ signal types across 12 domains',
      'Docker deployment',
      'Community support (GitHub)',
    ],
    limitations: [
      'Self-managed infrastructure',
      'Manual threshold tuning',
      'No IC3 threat modules',
      'No regulatory watchdog',
      'No SAR auto-generation',
      'No natural language policies',
    ],
  },
  {
    name: 'Professional',
    price: '$2,500',
    period: '/month',
    description: 'Managed cloud + IC3 threat modules + enterprise AI. For growing teams.',
    cta: 'Start Free Trial',
    ctaHref: '/signup',
    highlight: true,
    features: [
      'Everything in Community, plus:',
      'Managed cloud deployment',
      'FBI IC3 Threat Intelligence modules:',
      '  \u2192 BEC Defense Suite',
      '  \u2192 Crypto Fraud Radar (Chainalysis)',
      '  \u2192 AI Threat Intel Feed',
      '  \u2192 Ransomware Exposure Engine',
      '  \u2192 Supply Chain Risk Monitor',
      'Auto-learning engine',
      'Natural language policy builder',
      'Regulatory watchdog (12 sources)',
      'SAR/STR draft generation',
      'Slack/Teams/Email notifications',
      'SSO (Google, Microsoft)',
      '8 enterprise integrations',
      'Email support (24h SLA)',
    ],
    limitations: [],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'On-prem, hybrid, or dedicated cloud. Full IC3 coverage.',
    cta: 'Contact Sales',
    ctaHref: 'mailto:enterprise@aigovhub.io',
    highlight: false,
    features: [
      'Everything in Professional, plus:',
      'On-premises deployment',
      'Hybrid mode (AI on-prem, UI cloud)',
      'Dedicated GPU infrastructure',
      'Multi-tenant MSP support',
      'SAML/LDAP SSO',
      'Unlimited integrations',
      'Custom AI skill development',
      'Regulator audit portal',
      'Chainalysis + TRM Labs (full)',
      'SecurityScorecard + MITRE ATT\u0026CK',
      'Bias & fairness monitoring',
      'Dedicated CSM (2h SLA)',
    ],
    limitations: [],
  },
];

export default function PricingPage() {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900">Simple, transparent pricing</h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Open-source core is free forever. Pay only for enterprise AI features and managed hosting.
          </p>
        </div>

        {/* Plan Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div key={plan.name} className={`rounded-2xl border-2 p-8 flex flex-col ${
              plan.highlight ? 'border-blue-600 bg-blue-50/30 shadow-xl shadow-blue-600/10 relative' : 'border-gray-200 bg-white'
            }`}>
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-3">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  {plan.period && <span className="text-gray-500 ml-1">{plan.period}</span>}
                </div>
                <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
              </div>

              <Link
                href={plan.ctaHref}
                className={`block text-center py-3 rounded-lg font-semibold text-sm transition-colors ${
                  plan.highlight
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                {plan.cta}
              </Link>

              <ul className="mt-8 space-y-3 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">{'\u2713'}</span>
                    <span className={i === 0 && plan.name !== 'Community' ? 'font-semibold text-gray-900' : 'text-gray-600'}>{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.limitations.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-xs text-gray-500 font-medium mb-2">Not included:</p>
                  <ul className="space-y-1.5">
                    {plan.limitations.map((lim, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                        <span className="mt-0.5 flex-shrink-0">{'\u2717'}</span>
                        {lim}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Deployment Options */}
        <div className="mt-24 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Deploy your way</h2>
          <p className="text-gray-600 mb-12">Your data, your infrastructure, your control. Always.</p>

          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <DeployOption title="Self-Hosted" desc="Everything on your hardware. 100% air-gapped." icon="server" badge="Free" />
            <DeployOption title="Private Cloud" desc="Your AWS, GCP, or Azure account. Your VPC." icon="cloud" badge="All plans" />
            <DeployOption title="Managed SaaS" desc="We host it. You focus on risk." icon="globe" badge="Pro & Enterprise" />
            <DeployOption title="Hybrid" desc="Dashboard in cloud. AI on-premises." icon="split" badge="Enterprise" />
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">Frequently asked questions</h2>
          <div className="space-y-6">
            <FAQ q="Is the open-source version really free?" a="Yes. The Community edition is Apache 2.0 licensed and free forever. You get the full core platform — signal ingestion, cross-domain fusion, evidence briefs, case management, all 7 AI skills, and audit logging. No artificial limitations." />
            <FAQ q="What do I need for self-hosted deployment?" a="Docker and 16GB RAM minimum. GPU is optional — you can run in cloud inference mode (using Claude/GPT API) without any GPU. For full on-prem AI, you need an NVIDIA RTX 4090 or better." />
            <FAQ q="Does my data ever leave my network?" a="In self-hosted and on-prem Enterprise modes: never. In hybrid mode: only PII-stripped reasoning queries go to cloud APIs. In managed SaaS: data is in our secured infrastructure. You choose." />
            <FAQ q="Can my compliance team audit the source code?" a="Absolutely. That's why we're open source. Your security team can verify every line that touches your data. Your regulator can inspect the evidence trail logic." />
            <FAQ q="What AI models do you use?" a="NVIDIA Nemotron-3-Super (120B, 12B active) for fast monitoring, and Nemotron-Cascade-2 (30B, 3B active, Gold Medal IMO) for deep reasoning. All open-weight models. In cloud mode, Claude or GPT. No vendor lock-in." />
            <FAQ q="How long until I see my first alert?" a="Days, not months. Unlike UEBA tools that need weeks of baselining, our reasoning models analyze patterns from day one. Connect your first data source and alerts start flowing." />
            <FAQ q="What are the IC3 Threat Intelligence modules?" a="Five new detection modules aligned to the FBI IC3 2025 Internet Crime Report: BEC Defense Suite (email analytics, vendor impersonation), Crypto Fraud Radar (Chainalysis/TRM Labs wallet scoring, pig butchering detection), AI Threat Intel Feed (AI-generated phishing detection), Ransomware Exposure Engine (MITRE ATT&CK TTP mapping, attack surface scoring), and Supply Chain Risk Monitor (SecurityScorecard vendor rating). These address the $20B+ in FBI-documented losses." />
            <FAQ q="Do I need Chainalysis/TRM Labs licenses separately?" a="No. Professional and Enterprise plans include pre-integrated access to blockchain analytics via our API partnerships. For Enterprise clients with existing Chainalysis/TRM Labs licenses, we support direct integration with your existing accounts." />
          </div>
        </div>
      </div>
    </section>
  );
}

function DeployOption({ title, desc, icon, badge }: { title: string; desc: string; icon: string; badge: string }) {
  const icons: Record<string, string> = { server: '\u{1F5A5}', cloud: '\u2601', globe: '\u{1F310}', split: '\u{1F500}' };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
      <div className="text-2xl mb-2">{icons[icon]}</div>
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="text-xs text-gray-500 mt-1">{desc}</p>
      <span className="inline-block mt-3 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{badge}</span>
    </div>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <div className="border-b border-gray-200 pb-6">
      <h3 className="font-semibold text-gray-900">{q}</h3>
      <p className="text-sm text-gray-600 mt-2">{a}</p>
    </div>
  );
}
