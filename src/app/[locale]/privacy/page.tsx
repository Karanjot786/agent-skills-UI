import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal-page';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy Policy | agentskills.in',
  description: 'What data agentskills.in and the Agent Skills CLI collect, why, and your rights under DPDP and GDPR.',
  alternates: { canonical: absoluteUrl('/privacy') },
};

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="2026-10-09">
      {/* DRAFT - review with a lawyer/CA (India DPDP Act 2023, EU GDPR) before relying on it. */}
      <h2>1. Who we are</h2>
      <p>The controller (data fiduciary) is Karanjot Singh Dhillon (the operator of agentskills.in). Contact: legal@agentskills.in.</p>
      <h2>2. What we collect</h2>
      <ul>
        <li><strong>Website analytics:</strong> Google Analytics 4 and Microsoft Clarity record pages viewed, device, approximate location and referrer. You can block them with a browser extension.</li>
        <li><strong>Server logs:</strong> Cloudflare processes IP addresses and user agents to deliver the site and stop abuse.</li>
        <li><strong>CLI telemetry:</strong> the Agent Skills CLI sends anonymous counts of events (for example install or search), with no search text and no personal identifiers. It is disclosed in the CLI README and on first run, and can be turned off with the documented opt-out setting.</li>
        <li><strong>Submissions:</strong> if you submit a repo, we store the repo URL and the time.</li>
        <li><strong>Sponsors:</strong> name, company, email and invoice details. Card details are handled only by Polar and never reach us.</li>
        <li><strong>Public GitHub data:</strong> the Site indexes public repository metadata, including author usernames and avatars. This is already public.</li>
      </ul>
      <h2>3. Why (legal basis)</h2>
      <p>To run and secure the Site (legitimate interest), to measure and improve it (legitimate interest, or consent where the law needs it), and to perform sponsor contracts and meet tax obligations (contract and legal duty).</p>
      <h2>4. Sharing</h2>
      <p>Processors only: Cloudflare (hosting), Google (analytics), Microsoft (Clarity), Polar (payments), and our email provider. We do not sell personal data.</p>
      <h2>5. Retention</h2>
      <p>Analytics according to each provider&apos;s settings (up to 14 months in GA4), telemetry counts indefinitely (they are not personal), sponsor records for the period tax law requires.</p>
      <h2>6. Your rights</h2>
      <p>Under India&apos;s DPDP Act and the EU/UK GDPR you can ask to access, correct or erase your data, withdraw consent, and complain to a regulator. Email legal@agentskills.in and we reply within 30 days. International transfers happen through our processors under their standard contractual clauses.</p>
      <h2>7. Children</h2>
      <p>The Site is not directed at children under 16, and we do not knowingly collect their data.</p>
      <h2>8. Changes</h2>
      <p>We will change the date above when this policy changes.</p>
    </LegalPage>
  );
}
