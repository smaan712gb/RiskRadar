'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Overview', href: '/overview', icon: 'grid' },
  { name: 'Alerts', href: '/alerts', icon: 'bell', badge: true },
  { name: 'Cases', href: '/cases', icon: 'folder' },
  { name: 'Risk Scores', href: '/risk-scores', icon: 'activity' },
  { name: 'Signals', href: '/signals', icon: 'radio' },
  { name: 'Policies', href: '/policies', icon: 'shield' },
  { name: 'Integrations', href: '/integrations', icon: 'plug' },
  { name: 'Agents', href: '/agents', icon: 'cpu' },
  { name: 'Audit Log', href: '/audit-log', icon: 'scroll' },
  { name: 'Settings', href: '/settings', icon: 'settings' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-brand-900 text-white">
      <div className="flex h-16 items-center px-6">
        <h1 className="text-xl font-bold tracking-tight">
          <span className="text-blue-400">Risk</span>Radar
        </h1>
      </div>

      <nav className="mt-4 px-3 space-y-1">
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
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
            JA
          </div>
          <div className="text-sm">
            <div className="font-medium">Jane Analyst</div>
            <div className="text-gray-400 text-xs">analyst@demo-bank.com</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function getIcon(name: string): string {
  const icons: Record<string, string> = {
    grid: '\u25A6', bell: '\u{1F514}', folder: '\u{1F4C1}', activity: '\u{1F4C8}',
    radio: '\u{1F4E1}', shield: '\u{1F6E1}', plug: '\u{1F50C}', cpu: '\u{1F916}',
    scroll: '\u{1F4DC}', settings: '\u2699',
  };
  return icons[name] ?? '\u2022';
}
