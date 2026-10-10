import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { absoluteUrl } from '@/lib/site';
import raw from '../../../../content/report/state-of-agent-skills.json';

type Report = {
  generatedAt: string | null;
  totals: { skills: number; indexable: number; repos: number; authors: number };
  scan: { scannedSkills: number; scannedShare: string; avgTokens: number };
  duplicates: { skillsInDuplicateGroups: number; groups: number; share: string };
  findings: {
    highOrCriticalSkills: number; highOrCriticalShare: string; confirmedSkills: number;
    bySeverityStatus: { severity: string; status: string; findings: number; skills: number }[];
    topRules: { rule_id: string; severity: string; skills: number }[];
  };
  categories: { category: string; skills: number }[];
};
// ponytail: committed JSON stays a stub (generatedAt null) until build-report runs against remote D1; the page 404s until then.
const data = raw as Report;

const TITLE = 'State of Agent Skills 2026: we scanned every public skill';
export const metadata: Metadata = {
  title: `${TITLE} | agentskills.in`,
  description: `${data.totals.skills.toLocaleString('en-US')} public agent skills scanned: ${data.duplicates.share} are copies and ${data.findings.highOrCriticalShare} have high or critical findings.`,
  alternates: { canonical: absoluteUrl('/report') },
};
const n = (v: number) => v.toLocaleString('en-US');

export default function ReportPage() {
  const d = data;
  if (!d.generatedAt) notFound();
  return (
    <>
      <Navbar />
      <main className="container mx-auto max-w-3xl px-6 py-16 text-zinc-300 [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-white [&_p]:mb-3 [&_table]:w-full [&_td]:py-1 [&_th]:text-left">
        <h1 className="text-3xl font-bold text-white mb-1">{TITLE}</h1>
        <p className="text-sm text-zinc-500">Data as of {d.generatedAt}. Free to cite with a link to this page.</p>
        <h2>Headline numbers</h2>
        <ul className="list-disc pl-6 mb-3 space-y-1">
          <li>{n(d.totals.skills)} skills in {n(d.totals.repos)} repos by {n(d.totals.authors)} authors; {n(d.totals.indexable)} have enough text to index.</li>
          <li>{n(d.scan.scannedSkills)} skills scanned ({d.scan.scannedShare}). Average size {n(d.scan.avgTokens)} tokens.</li>
          <li>{n(d.duplicates.skillsInDuplicateGroups)} skills ({d.duplicates.share} of scanned) have byte-identical content to another skill, in {n(d.duplicates.groups)} groups.</li>
          <li>{n(d.findings.highOrCriticalSkills)} skills ({d.findings.highOrCriticalShare}) have at least one high or critical finding. {n(d.findings.confirmedSkills)} are human-confirmed.</li>
        </ul>
        <h2>Findings by severity</h2>
        <table><thead><tr><th>Severity</th><th>Status</th><th>Findings</th><th>Skills</th></tr></thead><tbody>
          {d.findings.bySeverityStatus.map((r) => <tr key={r.severity + r.status}><td>{r.severity}</td><td>{r.status}</td><td>{n(r.findings)}</td><td>{n(r.skills)}</td></tr>)}
        </tbody></table>
        <h2>Most common rules</h2>
        <table><thead><tr><th>Rule</th><th>Severity</th><th>Skills</th></tr></thead><tbody>
          {d.findings.topRules.map((r) => <tr key={r.rule_id}><td>{r.rule_id}</td><td>{r.severity}</td><td>{n(r.skills)}</td></tr>)}
        </tbody></table>
        <h2>Categories</h2>
        <table><tbody>{d.categories.map((c) => <tr key={c.category}><td>{c.category}</td><td>{n(c.skills)}</td></tr>)}</tbody></table>
        <h2>Method and limits</h2>
        <p>We collected public skills from GitHub, hashed each skill&apos;s text (SHA-256) to find exact copies, counted tokens, and ran our 34 static rules over the text. A finding is an automated signal that a rule matched. It is not proof of harm. We call a skill malicious only after a human confirms it, and we told authors of confirmed items before publishing. Near-duplicates (forks with small edits) are not counted, so the duplicate share is a lower bound. Rules can have false positives; we reviewed the top 200 high and critical findings by hand.</p>
        <h2>Data</h2>
        <p><a className="text-cyan-400 underline" href="/data/state-of-agent-skills-2026-10.csv">Download the CSV</a> (one row per repo: skills, stars, duplicate skills, findings, highest severity). Dispute a finding via <a className="text-cyan-400 underline" href="/takedown">/takedown</a>.</p>
      </main>
      <Footer />
    </>
  );
}
