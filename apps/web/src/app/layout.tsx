import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RisksRadarAI — Cross-Domain Risk Intelligence for Regulated Enterprises',
  description: 'The only platform that fuses signals across HR, Finance, Security, Operations, and Communications to detect compound risk patterns. On-premises AI. Regulator-ready evidence. Open source.',
  metadataBase: new URL('https://risksradarai.com'),
  openGraph: {
    title: 'RisksRadarAI — Cross-Domain Risk Intelligence',
    description: 'Detect compound risk patterns weeks before they become incidents. On-premises AI. Regulator-ready evidence. Open source.',
    url: 'https://risksradarai.com',
    siteName: 'RisksRadarAI',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RisksRadarAI — Cross-Domain Risk Intelligence',
    description: 'Detect compound risk patterns weeks before they become incidents.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 antialiased">{children}</body>
    </html>
  );
}
