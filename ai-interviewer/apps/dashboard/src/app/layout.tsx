import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Interviewer — Recruiter Dashboard',
  description: 'Review and approve AI-screened candidates',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface-0 text-ink">
        {/* Top nav */}
        <header className="sticky top-0 z-50 border-b border-edge bg-surface-1/95 backdrop-blur-sm">
          <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-6">
            <span className="h-2 w-2 rounded-full bg-brand shadow-[0_0_8px_#00d4aa]" />
            <span className="font-mono text-sm font-semibold tracking-tight text-ink">
              ai-interviewer
            </span>
            <span className="ml-1 text-ink-faint">/</span>
            <span className="text-sm text-ink-muted">Recruiter Dashboard</span>
            <div className="ml-auto flex items-center gap-2">
              <span className="rounded border border-brand bg-brand/10 px-2 py-0.5 font-mono text-[11px] text-brand">
                gemini-3.6-flash
              </span>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
