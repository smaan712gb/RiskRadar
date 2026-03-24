import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RiskRadar — AI Risk Intelligence Platform',
  description: 'Enterprise risk monitoring powered by on-premises AI reasoning',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}
