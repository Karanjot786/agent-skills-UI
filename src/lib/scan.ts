export function disputeUrl(itemType: string, itemRef: string, name: string): string {
  const q = new URLSearchParams({ template: 'scan-dispute.yml', title: `Scan dispute: ${name} (${itemType}/${itemRef})` });
  return `https://github.com/Karanjot786/agent-skills-UI/issues/new?${q}`;
}
