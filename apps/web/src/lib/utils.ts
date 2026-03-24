import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatScore(score: number): string {
  return Math.round(score).toString();
}

export function severityColor(severity: string): string {
  const colors: Record<string, string> = {
    critical: 'text-risk-critical bg-red-50 border-red-200',
    high: 'text-risk-high bg-orange-50 border-orange-200',
    medium: 'text-risk-medium bg-yellow-50 border-yellow-200',
    low: 'text-risk-low bg-green-50 border-green-200',
    info: 'text-risk-info bg-gray-50 border-gray-200',
  };
  return colors[severity] ?? colors['info']!;
}

export function trajectoryIcon(trajectory: string): string {
  const icons: Record<string, string> = {
    accelerating: '\u2191\u2191',
    stable: '\u2192',
    declining: '\u2193',
    new: '\u2022',
  };
  return icons[trajectory] ?? '\u2022';
}

export function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}
