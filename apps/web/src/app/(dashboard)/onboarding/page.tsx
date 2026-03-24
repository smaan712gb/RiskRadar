'use client';

import { useState } from 'react';

const steps = [
  { title: 'Regulatory Frameworks', description: 'Select the compliance frameworks applicable to your organization' },
  { title: 'Connect Data Source', description: 'Connect your first enterprise system for signal ingestion' },
  { title: 'Alert Configuration', description: 'Set initial alert thresholds and notification preferences' },
  { title: 'Invite Team', description: 'Invite your compliance team and assign roles' },
  { title: 'First Scan', description: 'Run your first risk scan and see RiskRadar in action' },
];

const frameworks = [
  { id: 'BSA_AML', name: 'BSA/AML', desc: 'Bank Secrecy Act / Anti-Money Laundering', industry: ['banking', 'credit_union'] },
  { id: 'SOX', name: 'SOX', desc: 'Sarbanes-Oxley Act', industry: ['banking', 'insurance', 'technology'] },
  { id: 'HIPAA', name: 'HIPAA', desc: 'Health Insurance Portability and Accountability', industry: ['healthcare'] },
  { id: 'GDPR', name: 'GDPR', desc: 'General Data Protection Regulation', industry: ['technology', 'retail'] },
  { id: 'PCI_DSS', name: 'PCI DSS', desc: 'Payment Card Industry Data Security Standard', industry: ['retail', 'banking'] },
  { id: 'NIST_CSF', name: 'NIST CSF', desc: 'NIST Cybersecurity Framework', industry: ['government', 'technology'] },
  { id: 'DORA', name: 'DORA', desc: 'Digital Operational Resilience Act (EU)', industry: ['banking', 'insurance'] },
  { id: 'AI_ACT', name: 'EU AI Act', desc: 'EU Artificial Intelligence Act', industry: ['technology'] },
];

const integrations = [
  { id: 'sap', name: 'SAP S/4HANA', type: 'Finance/ERP', icon: 'erp' },
  { id: 'splunk', name: 'Splunk', type: 'SIEM/Security', icon: 'siem' },
  { id: 'workday', name: 'Workday', type: 'HR/HRIS', icon: 'hr' },
  { id: 'azure_ad', name: 'Azure AD', type: 'Identity', icon: 'iam' },
  { id: 'microsoft365', name: 'Microsoft 365', type: 'Communications', icon: 'comm' },
  { id: 'jira', name: 'Jira', type: 'Operations', icon: 'ops' },
  { id: 'slack', name: 'Slack', type: 'Communications', icon: 'comm' },
  { id: 'salesforce', name: 'Salesforce', type: 'CRM', icon: 'crm' },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>(['BSA_AML', 'SOX']);
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);

  function toggleFramework(id: string) {
    setSelectedFrameworks((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    );
  }

  function nextStep() {
    if (currentStep < steps.length - 1) setCurrentStep((s) => s + 1);
    else window.location.href = '/overview';
  }

  return (
    <div className="max-w-3xl mx-auto py-12">
      {/* Progress */}
      <div className="flex items-center mb-12">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold border-2 ${
              i < currentStep ? 'bg-green-500 border-green-500 text-white' :
              i === currentStep ? 'bg-blue-600 border-blue-600 text-white' :
              'bg-white border-gray-300 text-gray-400'
            }`}>
              {i < currentStep ? '\u2713' : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${i < currentStep ? 'bg-green-500' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{steps[currentStep]!.title}</h2>
        <p className="text-gray-500 mb-8">{steps[currentStep]!.description}</p>

        {/* Step 1: Regulatory Frameworks */}
        {currentStep === 0 && (
          <div className="grid grid-cols-2 gap-3">
            {frameworks.map((fw) => (
              <button
                key={fw.id}
                onClick={() => toggleFramework(fw.id)}
                className={`text-left p-4 rounded-lg border-2 transition-colors ${
                  selectedFrameworks.includes(fw.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-900 text-sm">{fw.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{fw.desc}</div>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Connect Integration */}
        {currentStep === 1 && (
          <div className="grid grid-cols-2 gap-3">
            {integrations.map((int) => (
              <button
                key={int.id}
                onClick={() => setSelectedIntegration(int.id)}
                className={`text-left p-4 rounded-lg border-2 transition-colors ${
                  selectedIntegration === int.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-900 text-sm">{int.name}</div>
                <div className="text-xs text-gray-500">{int.type}</div>
              </button>
            ))}
            <button onClick={() => nextStep()} className="text-left p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400">
              <div className="font-semibold text-gray-500 text-sm">Skip for now</div>
              <div className="text-xs text-gray-400">Connect later in Settings</div>
            </button>
          </div>
        )}

        {/* Step 3: Alert Configuration */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">High Risk Threshold</label>
              <input type="range" min="50" max="95" defaultValue="75" className="w-full" />
              <div className="flex justify-between text-xs text-gray-400 mt-1"><span>More alerts (50)</span><span>Fewer alerts (95)</span></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notification Channels</label>
              <div className="space-y-2">
                {['Email (all alerts)', 'Slack (#riskradar-alerts)', 'Microsoft Teams', 'SMS (critical only)'].map((ch) => (
                  <label key={ch} className="flex items-center gap-2 text-sm text-gray-600">
                    <input type="checkbox" defaultChecked={ch.includes('Email')} className="rounded" />
                    {ch}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Invite Team */}
        {currentStep === 3 && (
          <div className="space-y-4">
            {[
              { label: 'Compliance Officer', placeholder: 'compliance@yourcompany.com' },
              { label: 'CISO / Security Lead', placeholder: 'ciso@yourcompany.com' },
              { label: 'Analyst', placeholder: 'analyst@yourcompany.com' },
            ].map((invite, i) => (
              <div key={i}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{invite.label}</label>
                <input type="email" placeholder={invite.placeholder} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm" />
              </div>
            ))}
            <p className="text-xs text-gray-400">Invitations will be sent when you complete setup. You can add more team members later.</p>
          </div>
        )}

        {/* Step 5: First Scan */}
        {currentStep === 4 && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">{'\u{1F680}'}</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to launch!</h3>
            <p className="text-gray-600 mb-6">
              RiskRadar will begin monitoring your connected systems immediately.
              Your first alerts should appear within hours.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
              <strong>What happens next:</strong>
              <ul className="mt-2 space-y-1 text-left">
                <li>- Collection agents start ingesting signals from connected systems</li>
                <li>- Fusion engine begins cross-domain correlation analysis</li>
                <li>- Regulatory watchdog activates for your selected frameworks</li>
                <li>- Dashboard populates as data flows in</li>
              </ul>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-200">
          <button
            onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
            disabled={currentStep === 0}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30"
          >
            Back
          </button>
          <div className="text-xs text-gray-400">Step {currentStep + 1} of {steps.length}</div>
          <button
            onClick={nextStep}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
          >
            {currentStep === steps.length - 1 ? 'Launch RiskRadar' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
