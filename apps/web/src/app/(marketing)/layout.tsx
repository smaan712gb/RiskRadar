import Link from 'next/link';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">
            <span className="text-blue-600">Risk</span>Radar
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

      {children}

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <div className="space-y-2 text-sm">
                <div><Link href="/#features" className="hover:text-white">Features</Link></div>
                <div><Link href="/pricing" className="hover:text-white">Pricing</Link></div>
                <div><a href="https://github.com/smaan712gb/RiskRadar" className="hover:text-white">Open Source</a></div>
                <div><Link href="/login" className="hover:text-white">Dashboard</Link></div>
              </div>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Deployment</h3>
              <div className="space-y-2 text-sm">
                <div><span className="hover:text-white">Self-Hosted</span></div>
                <div><span className="hover:text-white">Private Cloud</span></div>
                <div><span className="hover:text-white">Managed SaaS</span></div>
                <div><span className="hover:text-white">Hybrid</span></div>
              </div>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <div className="space-y-2 text-sm">
                <div><a href="https://github.com/smaan712gb/RiskRadar" className="hover:text-white">Documentation</a></div>
                <div><span className="hover:text-white">API Reference</span></div>
                <div><span className="hover:text-white">Blog</span></div>
                <div><span className="hover:text-white">Compliance Guides</span></div>
              </div>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <div className="space-y-2 text-sm">
                <div><a href="https://aigovhub.io" className="hover:text-white">AIGovHub</a></div>
                <div><span className="hover:text-white">Contact</span></div>
                <div><span className="hover:text-white">Terms of Service</span></div>
                <div><span className="hover:text-white">Privacy Policy</span></div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 flex items-center justify-between">
            <p className="text-sm">2026 RiskRadar by AIGovHub. Apache 2.0 Open Source.</p>
            <p className="text-sm">Your data, your infrastructure, your control.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
