import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';

// alternates: {} replaces the layout's home canonical/hreflang; robots replaces the layout's "index".
export const metadata: Metadata = {
    title: { absolute: 'Page not found | Agent Skills' },
    description: 'This page does not exist. Browse the Agent Skills marketplace instead.',
    robots: { index: false, follow: true },
    alternates: {},
};

export default function NotFound() {
    return (
        <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4 px-6">
            <h1 className="text-3xl font-bold">Page not found</h1>
            <Link href="/marketplace" className="text-cyan-400 hover:underline">Browse the marketplace</Link>
        </main>
    );
}
