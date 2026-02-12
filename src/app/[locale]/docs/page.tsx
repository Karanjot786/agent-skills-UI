import { getAllDocSections } from '@/lib/mdx';
import { DocsClient } from '@/components/docs-client';

export const metadata = {
    title: 'CLI Documentation — Agent Skills',
    description: 'Complete reference for the Agent Skills CLI. 52 commands across 42 agents.',
};

export default function DocsPage() {
    const sections = getAllDocSections();

    return <DocsClient sections={sections} />;
}
