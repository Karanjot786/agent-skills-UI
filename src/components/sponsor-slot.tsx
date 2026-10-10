'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

interface Sponsor { id: number; title: string; url: string; image: string | null; blurb: string | null }

// Fetched after mount: never in server/ISR HTML, so sponsors cannot affect ranking. Always labelled.
export function SponsorSlot({ placement, locale, className = '' }: { placement: string; locale: string; className?: string }) {
  const t = useTranslations('sponsor');
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);

  useEffect(() => {
    let live = true;
    fetch(`/api/sponsors?placement=${encodeURIComponent(placement)}&locale=${encodeURIComponent(locale)}`)
      .then((r) => (r.ok ? r.json<{ sponsors?: Sponsor[] }>() : { sponsors: [] }))
      .then((d) => { if (live) setSponsors(d.sponsors ?? []); })
      .catch(() => {});
    return () => { live = false; };
  }, [placement, locale]);

  if (sponsors.length === 0) return null;
  return (
    <aside aria-label={t('label')} className={`container mx-auto px-6 py-6 ${className}`}>
      <div className="grid gap-4 md:grid-cols-3">
        {sponsors.map((s) => (
          <a key={s.id} href={s.url} target="_blank" rel="sponsored nofollow noopener"
             className="block rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:border-cyan-400/40 transition-colors">
            <span className="mb-2 inline-block rounded border border-zinc-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              {t('label')}
            </span>
            <div className="flex items-center gap-3">
              {s.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={s.image} alt="" className="size-10 rounded-md" loading="lazy" />}
              <div>
                <div className="font-semibold text-zinc-100">{s.title}<span className="sr-only"> ({t('newTab')})</span></div>
                {s.blurb && <p className="text-sm text-zinc-400">{s.blurb}</p>}
              </div>
            </div>
          </a>
        ))}
      </div>
    </aside>
  );
}
