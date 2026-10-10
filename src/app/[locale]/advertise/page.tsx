import type { Metadata } from 'next';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { absoluteUrl } from '@/lib/site';
import { TRAFFIC as T } from '@/lib/traffic';
import { foundingPrice } from '@/lib/sponsors';

// ponytail: config lives here (one page uses it). Set each Polar checkout link once the product exists; null => email button.
const PRICES = { category: 149, home: 299, takeover: 499 } as const;
const POLAR_LINKS: Record<'category' | 'home' | 'takeover', string | null> = { category: null, home: null, takeover: null };
const CONTACT = { sponsors: 'sponsors@agentskills.in' } as const;

export const metadata: Metadata = {
  title: 'Advertise on Agent Skills | agentskills.in',
  description: 'Sponsor a labelled slot in front of developers who install AI agent skills, MCP servers and plugins. Real traffic numbers, flat monthly prices.',
  alternates: { canonical: absoluteUrl('/advertise') },
};

const fmt = (n: number) => n.toLocaleString('en-US');
const tiers = [
  { key: 'category', name: 'Category slot', price: PRICES.category, where: 'One category page (for example devops, testing, security).' },
  { key: 'home', name: 'Home or type index', price: PRICES.home, where: 'Home page, or the MCP / agents / plugins index.' },
  { key: 'takeover', name: 'Category takeover', price: PRICES.takeover, where: 'All slots in one category plus its newsletter mention.' },
] as const;

export default function AdvertisePage() {
  const humanEngaged = Object.values(T.ga4.engagedReferrals).reduce((a, b) => a + b, 0);
  return (
    <>
      <Navbar />
      <main className="container mx-auto max-w-3xl px-6 py-16 text-zinc-300">
        <h1 className="text-3xl font-bold text-white mb-4">Advertise on Agent Skills</h1>
        <p className="mb-8">We list {fmt(T.catalog.skills)} agent skills from {fmt(T.catalog.repos)} GitHub repos, and the site is growing from a small base. Here is exactly what we measure, as of {T.asOf}. You pay for a labelled placement, and sponsors never change search results or ranking.</p>

        <h2 className="text-xl font-semibold text-white mb-3">Traffic (last {T.windowDays} days, GA4 and Search Console)</h2>
        <ul className="list-disc pl-6 space-y-1 mb-3">
          <li>{fmt(T.ga4.sessions)} GA4 sessions, of which about {fmt(T.ga4.botLikeSessions)} look like bot traffic. We do not count those.</li>
          <li>{fmt(humanEngaged)} engaged sessions from referrals: {Object.entries(T.ga4.engagedReferrals).map(([k, v]) => `${k} ${v}`).join(', ')}.</li>
          <li>Google Search: {T.gsc.clicks} clicks and {fmt(T.gsc.impressions)} impressions. Google has only started indexing the site; we expect organic growth from week 4 to 8.</li>
          <li>CLI: about {fmt(T.cli.npmDownloadsPerMonth)} npm downloads per month.</li>
        </ul>
        <p className="mb-8 text-sm text-zinc-500">We publish these numbers weekly and update this page. If you would rather wait until they are bigger, that is a fair call. Founding sponsors lock a lower price.</p>

        <h2 className="text-xl font-semibold text-white mb-3">Placements and prices (USD per month)</h2>
        <div className="grid gap-4 md:grid-cols-3 mb-4">
          {tiers.map((t) => (
            <div key={t.key} className="rounded-xl border border-white/10 p-4">
              <div className="font-semibold text-white">{t.name}</div>
              <div className="text-2xl font-bold text-white">${t.price}</div>
              <div className="text-sm text-cyan-400">Founding price ${foundingPrice(t.price)} (first 5 sponsors, 30% off)</div>
              <p className="text-sm mt-2">{t.where}</p>
              <a className="mt-3 inline-block rounded bg-cyan-500 px-3 py-1.5 text-sm font-semibold text-black"
                 href={POLAR_LINKS[t.key] ?? `mailto:${CONTACT.sponsors}?subject=${encodeURIComponent(t.name + ' sponsorship')}`}
                 {...(POLAR_LINKS[t.key] ? { target: '_blank', rel: 'noopener' } : {})}>
                {POLAR_LINKS[t.key] ? 'Pay with Polar' : 'Email us to book'}
              </a>
            </div>
          ))}
        </div>

        <h2 className="text-xl font-semibold text-white mt-8 mb-3">How it works</h2>
        <ol className="list-decimal pl-6 space-y-1 mb-8">
          <li>Pick a placement and pay through Polar (merchant of record, handles tax), or email {CONTACT.sponsors} for an invoice.</li>
          <li>Send a title, link, one line of copy and an optional square logo (https only).</li>
          <li>We switch the slot on within one business day. It shows a &quot;Sponsored&quot; label, and links use rel=&quot;sponsored nofollow&quot;.</li>
          <li>Cancel any month. No data about visitors is shared with sponsors.</li>
        </ol>

        <h2 className="text-xl font-semibold text-white mb-3">Rules</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Sponsored slots are separate from search and category ordering. Payment never changes rank.</li>
          <li>We decline sponsors whose product fails our own security scan or that we cannot verify.</li>
          <li>Some tool pages carry affiliate links (for example Railway). These are disclosed on the page.</li>
        </ul>
      </main>
      <Footer />
    </>
  );
}
