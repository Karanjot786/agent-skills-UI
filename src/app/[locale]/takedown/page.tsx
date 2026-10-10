import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal-page';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Takedown and Dispute Policy | agentskills.in',
  description: 'How to ask agentskills.in to remove a listing, opt out of full-text display, or dispute a scan finding.',
  alternates: { canonical: absoluteUrl('/takedown') },
};

export default function Takedown() {
  return (
    <LegalPage title="Takedown and Dispute Policy" updated="2026-10-09">
      {/* DRAFT - review with a lawyer/CA (DMCA safe harbour, IT Rules 2021) before relying on it. */}
      <h2>Remove a listing or opt out</h2>
      <p>If you own a repository we index and want it removed, or want only the title and link shown (no excerpt or full text), choose one:</p>
      <ul>
        <li>Add a file named <code>.agentskills-ignore</code> to the repo root. We check it on every refresh.</li>
        <li>Or email legal@agentskills.in from an address that can be linked to the repo owner, with the repo URL.</li>
      </ul>
      <p>We act within 3 business days and keep the item off the index afterwards.</p>
      <h2>Copyright complaint</h2>
      <p>Email legal@agentskills.in with: the work you own, the URL on our Site, your contact details, a statement that you act in good faith and that the information is accurate, and your signature. We remove the content and notify the poster, who may send a counter-notice.</p>
      <h2>Dispute a scan finding</h2>
      <p>Findings are automated and can be wrong. Open an issue titled &quot;Dispute: owner/repo&quot; at github.com/Karanjot786/agent-skills-cli/issues, or email legal@agentskills.in. A human reviews it, and we mark false positives and update the badge.</p>
      <h2>Report a harmful skill</h2>
      <p>Email legal@agentskills.in with the URL and what it does. We label items &quot;malicious&quot; only after human confirmation, and we notify the author first when we can.</p>
    </LegalPage>
  );
}
