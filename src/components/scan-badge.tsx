import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { getDb } from '@/lib/db';
import { disputeUrl } from '@/lib/scan';

type BadgeFinding = { rule_id: string; severity: string; excerpt: string };

const SEV_CLASS: Record<string, string> = {
  critical: 'text-red-400',
  high: 'text-orange-400',
  medium: 'text-yellow-400',
};

// Counts critical/high/medium findings that are not false_positive; low/info stay in the database only.
export async function ScanBadge({ itemType, itemRef, name }: { itemType: string; itemRef: string; name?: string }) {
  const db = getDb();
  const [metric, rows] = await Promise.all([
    db.prepare('SELECT scanned_at FROM item_metrics WHERE item_type = ? AND item_ref = ?').bind(itemType, itemRef).first<{ scanned_at: string }>(),
    db.prepare(
      `SELECT rule_id, severity, excerpt FROM findings
       WHERE item_type = ? AND item_ref = ? AND status <> 'false_positive' AND severity IN ('critical','high','medium')
       ORDER BY CASE severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 ELSE 2 END, rule_id LIMIT 50`,
    ).bind(itemType, itemRef).all<BadgeFinding>(),
  ]);
  const findings = rows.results ?? [];
  const pill = 'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm';

  if (!metric) {
    return <div className={`${pill} bg-zinc-800/50 text-zinc-400`}><Shield aria-hidden="true" className="size-3.5" /><span>Not scanned</span></div>;
  }
  const scannedOn = metric.scanned_at.slice(0, 10);
  if (!findings.length) {
    return (
      <div className={`${pill} bg-emerald-500/10 text-emerald-400`}>
        <ShieldCheck aria-hidden="true" className="size-3.5" /><span>Scanned · no issues</span>
        <span className="sr-only"> (scanned {scannedOn} with agent-skills-cli rules)</span>
      </div>
    );
  }
  return (
    <details className="group">
      <summary className={`${pill} bg-orange-500/10 text-orange-400 cursor-pointer list-none`}>
        <ShieldAlert aria-hidden="true" className="size-3.5" />
        <span>Scanned · {findings.length} finding{findings.length === 1 ? '' : 's'}</span>
      </summary>
      <div className="mt-2 p-3 rounded-lg bg-zinc-900 border border-white/10 text-xs max-w-xl">
        <p className="text-zinc-400 mb-2">Pattern matches from {scannedOn}. A finding is not a verdict; review the source.</p>
        <ul className="space-y-1.5">
          {findings.map((f) => (
            <li key={`${f.rule_id}-${f.excerpt}`}>
              <span className={`font-mono ${SEV_CLASS[f.severity] ?? 'text-zinc-300'}`}>{f.severity.toUpperCase()} {f.rule_id}</span>
              <code className="block text-zinc-400 truncate">{f.excerpt}</code>
            </li>
          ))}
        </ul>
        <a href={disputeUrl(itemType, itemRef, name ?? itemRef)} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-cyan-400 hover:underline">Dispute a finding</a>
      </div>
    </details>
  );
}
