export function disputeUrl(itemType: string, itemRef: string, name: string): string {
  const q = new URLSearchParams({ template: 'scan-dispute.yml', title: `Scan dispute: ${name} (${itemType}/${itemRef})` });
  return `https://github.com/Karanjot786/agent-skills-UI/issues/new?${q}`;
}

// Scan summary in the item API: counts critical/high/medium findings that are not false_positive (same as ScanBadge).
export function itemScan(scannedAt: string | null, findings: number) {
  if (!scannedAt) return { status: 'not_scanned' as const };
  return { status: findings ? ('findings' as const) : ('scanned' as const), findings, scannedAt };
}
