import type { ReactNode } from 'react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
// ponytail: flip to true only after a lawyer/CA has reviewed /terms, /privacy, /takedown.
const LEGAL_REVIEWED = false;

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="container mx-auto max-w-3xl px-6 py-16 text-zinc-300 [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-white [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3">
        <h1 className="text-3xl font-bold text-white mb-1">{title}</h1>
        <p className="text-sm text-zinc-500 mb-6">Last updated {updated}</p>
        {!LEGAL_REVIEWED && (
          <p className="mb-6 rounded border border-yellow-600/50 bg-yellow-900/20 p-3 text-sm text-yellow-200">
            Draft. This text has not yet been reviewed by a lawyer. Contact legal@agentskills.in with questions.
          </p>
        )}
        {children}
      </main>
      <Footer />
    </>
  );
}
