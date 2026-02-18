import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export default function DocsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30 flex flex-col">
            <Navbar />
            {children}
            <Footer />
        </div>
    );
}
