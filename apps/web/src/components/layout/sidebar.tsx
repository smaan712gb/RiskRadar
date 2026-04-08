'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store';
import { DEMO_USERS, TFCU_TENANT } from '@/lib/demo-data';

const navigation = [
  { name: 'Overview', href: '/overview', icon: 'grid' },
  { name: 'Threat Intel', href: '/threat-intel', icon: 'radar' },
  { name: 'Alerts', href: '/alerts', icon: 'bell', badge: true },
  { name: 'Cases', href: '/cases', icon: 'folder' },
  { name: 'Risk Scores', href: '/risk-scores', icon: 'activity' },
  { name: 'Signals', href: '/signals', icon: 'radio' },
  { name: 'Policies', href: '/policies', icon: 'shield' },
  { name: 'Integrations', href: '/integrations', icon: 'plug' },
  { name: 'Agents', href: '/agents', icon: 'cpu' },
  { name: 'Audit Log', href: '/audit-log', icon: 'scroll' },
  { name: 'Reports', href: '/reports', icon: 'chart' },
  { name: 'Settings', href: '/settings', icon: 'settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, hydrate, logout } = useAuthStore();

  useEffect(() => { hydrate(); }, [hydrate]);

  // Display user info — from auth or demo defaults
  const displayUser = user ?? { name: DEMO_USERS[3]!.name, email: DEMO_USERS[3]!.email, role: 'analyst' };
  const initials = displayUser.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const tenantName = user?.tenantName ?? TFCU_TENANT.name;

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-brand-900 text-white flex flex-col">
      <div className="flex h-16 items-center px-6">
        <h1 className="text-xl font-bold tracking-tight">
          <span className="text-blue-400">Risk</span>Radar
        </h1>
      </div>

      {/* Tenant Badge */}
      <div className="mx-3 mb-3 px-3 py-2 bg-white/5 rounded-lg">
        <div className="text-xs text-gray-400 uppercase tracking-wider">Organization</div>
        <div className="text-sm font-medium text-white truncate">{tenantName}</div>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white',
              )}
            >
              <span className="w-5 text-center opacity-70">{getIcon(item.icon)}</span>
              {item.name}
              {item.badge && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  12
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="text-sm flex-1 min-w-0">
            <div className="font-medium truncate">{displayUser.name}</div>
            <div className="text-gray-400 text-xs truncate">{displayUser.role}</div>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-white text-xs flex-shrink-0"
            title="Sign out"
          >
            &#x2192;
          </button>
        </div>
      </div>
    </aside>
  );
}

function getIcon(name: string): string {
  const icons: Record<string, string> = {
    grid: '\u25A6', radar: '\u{1F6F0}', bell: '\u{1F514}', folder: '\u{1F4C1}', activity: '\u{1F4C8}',
    radio: '\u{1F4E1}', shield: '\u{1F6E1}', plug: '\u{1F50C}', cpu: '\u{1F916}',
    scroll: '\u{1F4DC}', settings: '\u2699', chart: '\u{1F4CA}',
  };
  return icons[name] ?? '\u2022';
}
