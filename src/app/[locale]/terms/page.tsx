import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal-page';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Terms of Service | agentskills.in',
  description: 'Terms for using agentskills.in, the Agent Skills CLI index and sponsor placements.',
  alternates: { canonical: absoluteUrl('/terms') },
};

export default function Terms() {
  return (
    <LegalPage title="Terms of Service" updated="2026-10-09">
      {/* DRAFT - review with a lawyer/CA before relying on it. */}
      <h2>1. What this site is</h2>
      <p>agentskills.in (the Site) is an index of agent skills, MCP servers, subagents and plugins published by third parties on GitHub and elsewhere. We do not write, host the source of, or endorse listed items. Each item is the work of its own author and is governed by its own licence.</p>
      <h2>2. Use of the Site</h2>
      <p>You may browse, search and use the public API within the posted rate limits. You may not scrape at a rate that degrades the service, try to bypass limits, or use the Site to attack others.</p>
      <h2>3. No warranty, and our scans</h2>
      <p>Items are provided as is. Install and run third-party skills at your own risk. Our scanner reports &quot;findings&quot; against fixed rules on a stated date. A scan with no findings does not mean an item is safe, and a finding does not mean an item is malicious. We call something malicious only after human confirmation.</p>
      <h2>4. Sponsored and affiliate content</h2>
      <p>Sponsored placements are labelled &quot;Sponsored&quot; and use rel=&quot;sponsored nofollow&quot;. Payment never changes search order or ranking. Some links are affiliate links; we may earn a commission if you sign up, at no cost to you. Each is disclosed where it appears.</p>
      <h2>5. Sponsor terms</h2>
      <ul>
        <li>Sponsors pay monthly in advance through our payment provider (Polar, merchant of record) or by invoice, and may cancel for the next month.</li>
        <li>We may refuse or remove a sponsor that is misleading, unlawful, or fails our own scan. We refund the unused part of the month if we remove a sponsor without cause.</li>
        <li>We do not guarantee impressions or clicks. Traffic numbers on /advertise are measured and dated.</li>
      </ul>
      <h2>6. Intellectual property and removals</h2>
      <p>Listing metadata and excerpts come from public repositories. For full text we only show content under permissive licences. To remove an item see /takedown.</p>
      <h2>7. Liability</h2>
      <p>To the extent the law allows, we are not liable for indirect or consequential loss, or for loss arising from third-party items. Our total liability is limited to the amount you paid us in the 12 months before the claim.</p>
      <h2>8. Changes and law</h2>
      <p>We may update these terms and will change the date above. Indian law governs, and the courts of India (location to be confirmed by counsel) have jurisdiction, without limiting any mandatory consumer rights you have where you live.</p>
      <h2>9. Contact</h2>
      <p>legal@agentskills.in</p>
    </LegalPage>
  );
}
