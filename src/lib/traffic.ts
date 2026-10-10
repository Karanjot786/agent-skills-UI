// Measured numbers only. Update from visa/metrics/<date>.json each week. Do not round up.
export const TRAFFIC = {
  asOf: '2026-10-09',
  windowDays: 90,
  catalog: { skills: 222056, indexable: 208913, repos: 25798, authors: 21820 },
  ga4: {
    sessions: 25400,
    botLikeSessions: 19000, // China direct traffic, ~2% engagement; excluded from the claim below
    engagedReferrals: { 'chatgpt.com': 495, 'github.com': 370, 'bing': 114, 'google': 37 } as Record<string, number>,
  },
  gsc: { clicks: 11, impressions: 963 },
  cli: { npmDownloadsPerMonth: 1100 },
} as const;
