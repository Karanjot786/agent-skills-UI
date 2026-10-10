import { Star } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { itemPath } from '@/lib/items-sql';
import type { ItemListRow } from '@/lib/items';

export function ItemCard({ item }: { item: ItemListRow }) {
    return (
        <Link href={itemPath(item.type, item.slug)}
            className="block p-4 rounded-xl bg-zinc-900/30 border border-white/5 hover:border-cyan-500/30 transition-all">
            <div className="flex justify-between items-start gap-3 mb-2">
                <div className="min-w-0">
                    <div className="font-medium text-cyan-100 truncate">{item.name}</div>
                    <div className="text-xs text-zinc-500 truncate">by {item.author}</div>
                </div>
                <span className="flex items-center gap-1 text-xs text-zinc-400 shrink-0">
                    <Star className="size-3 text-yellow-500 fill-yellow-500" />
                    {item.stars.toLocaleString('en-US')}
                </span>
            </div>
            <p className="text-sm text-zinc-500 line-clamp-2">{item.description || 'No description provided.'}</p>
        </Link>
    );
}
