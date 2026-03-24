import Link from 'next/link';

export const metadata = { title: 'Security & Trust — RisksRadarAI', description: 'How RisksRadarAI protects your data. Security architecture and compliance.' };

export default function SecurityPage() {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-black">Security & Trust</h1>
          <p className="mt-4 text-xl text-gray-500 max-w-2xl mx-auto">RisksRadarAI monitors sensitive organizational data. Here&apos;s exactly how we protect it.</p>
        </div>

        <div className="max-w-4xl mx-auto space-y-12">
          {/* Data Privacy */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8">
            <h2 className="text-2xl font-bold mb-6">Data Privacy Architecture</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { title: 'Self-Hosted: Zero Data Egress', desc: 'When deployed on your infrastructure, no data ever leaves your network. AI inference runs locally via Nemotron models. We have zero access to your data.' },
                { title: 'Managed: Tenant Isolation', desc: 'Each organization has a completely isolated database, separate encryption keys, and dedicated agent sandboxes. No cross-tenant data access is possible.' },
                { title: 'Communication Metadata Only', desc: 'We analyze email/chat metadata (frequency, timing, response latency). We never read message content. Ever.' },
                { title: 'PII-Stripping Privacy Router', desc: 'When cloud inference is used, the Privacy Router strips all personally identifiable information before any data reaches external APIs.' },
              ].map((item) => (
                <div key={item.title} className="bg-gray-50 rounded-xl p-5">
                  <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Agent Sandboxing */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8">
            <h2 className="text-2xl font-bold mb-6">Agent Security (NemoClaw Sandboxing)</h2>
            <p className="text-gray-600 mb-6">Every AI agent runs in a policy-controlled sandbox with four isolation layers:</p>
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { layer: 'Landlock LSM', desc: 'Linux Security Module restricting filesystem access' },
                { layer: 'seccomp', desc: 'System call filtering prevents unauthorized operations' },
                { layer: 'Filesystem NS', desc: 'Isolated filesystem namespace per agent' },
                { layer: 'Network NS', desc: 'Deny-by-default networking — only whitelisted endpoints' },
              ].map((l) => (
                <div key={l.layer} className="bg-gray-900 text-white rounded-xl p-4">
                  <div className="text-sm font-bold text-blue-400 mb-1">{l.layer}</div>
                  <div className="text-xs text-gray-300">{l.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Encryption */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8">
            <h2 className="text-2xl font-bold mb-6">Encryption & Access Control</h2>
            <div className="space-y-4">
              {[
                { title: 'Encryption at Rest', desc: 'AES-256-GCM for all sensitive fields (credentials, PII). Database encrypted at the storage layer.' },
                { title: 'Encryption in Transit', desc: 'TLS 1.3 for all API communications. Internal service-to-service communication encrypted.' },
                { title: 'Role-Based Access Control', desc: '7 system roles (Admin, Compliance Officer, CISO, Analyst, Manager, Auditor, Regulator) with granular permissions.' },
                { title: 'Immutable Audit Trail', desc: 'Database triggers prevent UPDATE and DELETE on audit logs. Every action is permanently recorded.' },
                { title: 'Credential Management', desc: 'Integration credentials encrypted with AES-256-GCM and stored separately from configuration. Key rotation supported.' },
              ].map((item) => (
                <div key={item.title} className="flex gap-4 items-start">
                  <span className="text-green-500 font-bold mt-0.5">{'\u2713'}</span>
                  <div>
                    <div className="font-semibold text-gray-900">{item.title}</div>
                    <div className="text-sm text-gray-600">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8">
            <h2 className="text-2xl font-bold mb-6">Compliance Readiness</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { reg: 'BSA/AML', status: 'Supported', detail: 'SAR generation, override monitoring, transaction forensics' },
                { reg: 'SOX', status: 'Supported', detail: 'Internal control monitoring, audit trails, segregation of duties' },
                { reg: 'HIPAA', status: 'Supported', detail: 'On-prem deployment for PHI, access monitoring, breach detection' },
                { reg: 'GDPR', status: 'Supported', detail: 'Article 88 employee data, anonymization, right of access' },
                { reg: 'EU AI Act', status: 'Aligned', detail: 'Explainability, human oversight, risk management, transparency' },
                { reg: 'NIST CSF', status: 'Aligned', detail: 'Identify, Protect, Detect, Respond, Recover functions' },
              ].map((r) => (
                <div key={r.reg} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900">{r.reg}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === 'Supported' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{r.status}</span>
                  </div>
                  <p className="text-xs text-gray-500">{r.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Responsible AI */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8">
            <h2 className="text-2xl font-bold mb-6">Responsible AI Practices</h2>
            <div className="space-y-4 text-gray-600">
              <p><strong>Human-in-the-loop:</strong> All AI-generated alerts require human review before any action is taken. No automated personnel decisions.</p>
              <p><strong>Bias monitoring:</strong> Demographic attributes are never used as model inputs. Quarterly fairness audits check for disproportionate flagging across groups.</p>
              <p><strong>Explainability:</strong> Every alert includes a chain-of-thought reasoning chain showing exactly how the conclusion was reached, with source data citations.</p>
              <p><strong>Consent and transparency:</strong> Organizations are expected to inform employees about monitoring scope. We provide consent management tools and privacy controls.</p>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-gray-50 rounded-2xl p-8 text-center">
            <h2 className="text-xl font-bold mb-3">Security Questions?</h2>
            <p className="text-gray-600 mb-4">For security assessments, penetration test reports, or compliance documentation:</p>
            <a href="mailto:security@aigovhub.io" className="bg-gray-900 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-800 transition inline-block">security@aigovhub.io</a>
          </div>
        </div>
      </div>
    </section>
  );
}
