import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MRA Group P&L Presentation Engine | Business Plan 2025 - 2031',
  description: 'Interactive financial cockpit and dynamic scenario modeling platform for Mugi Rekso Abadi (MRA) Group.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0B0F19] text-slate-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
