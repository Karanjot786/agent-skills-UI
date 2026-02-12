'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from "framer-motion";
import { Search, Loader2, Star, Copy, Terminal, Filter, ChevronDown, ArrowUpDown, Package, Code2, TestTube, Sparkles, Zap, Cloud, FileText, Image, Plug, Bot, Settings, GraduationCap, MessageSquare, Database, Wrench, X, Check, GitBranch } from "lucide-react";
import { SubmitRepoForm } from "@/components/submit-repo-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from '@/i18n/navigation';
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { SkillGridSkeleton } from "@/components/skeletons";

interface Skill {
    id: string;
    name: string;
    description: string;
    author: string;
    stars: number;
    authorAvatar?: string;
    repoFullName?: string;
    scopedName?: string;
    category?: string;
    hasContent?: boolean;
}

interface Category {
    id: string;
    name: string;
    icon: string;
    skill_count: number;
}

// Icon mapping for categories
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    'Wrench': Wrench,
    'Code2': Code2,
    'Sparkles': Sparkles,
    'Database': Database,
    'MessageSquare': MessageSquare,
    'Cloud': Cloud,
    'TestTube': TestTube,
    'FileText': FileText,
    'Image': Image,
    'Plug': Plug,
    'Bot': Bot,
    'Settings': Settings,
    'GraduationCap': GraduationCap,
    'Zap': Zap,
    'Package': Package,
};

// Category color mapping for gradients
const categoryColors: Record<string, string> = {
    'development': 'from-blue-500 to-cyan-500',
    'ai': 'from-purple-500 to-pink-500',
    'testing': 'from-green-500 to-emerald-500',
    'devops': 'from-orange-500 to-amber-500',
    'security': 'from-red-500 to-rose-500',
    'documentation': 'from-indigo-500 to-violet-500',
    'database': 'from-teal-500 to-cyan-500',
    'default': 'from-zinc-500 to-zinc-400',
};

const sortOptions = [
    { label: 'Most Stars', value: 'stars' },
    { label: 'Recently Updated', value: 'recent' },
    { label: 'Name A-Z', value: 'name' },
];

const starFilters = [
    { label: 'Any', value: 0 },
    { label: '100+', value: 100 },
    { label: '1K+', value: 1000 },
    { label: '10K+', value: 10000 },
];

// Highlight search text with animated glow
function highlightText(text: string, searchQuery: string): React.ReactNode {
    if (!searchQuery || !text) return text;

    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) => {
        if (part.toLowerCase() === searchQuery.toLowerCase()) {
            return (
                <span
                    key={i}
                    className="bg-cyan-500/30 text-cyan-300 px-0.5 rounded animate-pulse"
                    style={{
                        textShadow: '0 0 8px rgba(34, 211, 238, 0.5)',
                    }}
                >
                    {part}
                </span>
            );
        }
        return part;
    });
}

function MarketplaceContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // Read initial values from URL
    const [query, setQuery] = useState(searchParams.get('search') || '');
    const [skills, setSkills] = useState<Skill[]>([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState<string | null>(null);
    const [category, setCategory] = useState(searchParams.get('category') || '');
    const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'stars');
    const [total, setTotal] = useState(0);
    const [showFilters, setShowFilters] = useState(false);
    const [author, setAuthor] = useState(searchParams.get('author') || '');
    const [categories, setCategories] = useState<Category[]>([]);
    const [minStars, setMinStars] = useState(parseInt(searchParams.get('minStars') || '0'));
    const [hasContent, setHasContent] = useState(searchParams.get('hasContent') === 'true');
    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const LIMIT = 20; // Reduced from 30 for faster initial load

    // Fetch categories on mount
    useEffect(() => {
        fetch('/api/categories')
            .then(res => res.json())
            .then(data => setCategories(data.categories || []))
            .catch(console.error);
    }, []);

    // Update URL when filters change
    const updateURL = (newCategory: string, newSortBy: string, newQuery: string, newAuthor: string) => {
        const params = new URLSearchParams();
        if (newQuery) params.set('search', newQuery);
        if (newCategory) params.set('category', newCategory);
        if (newSortBy && newSortBy !== 'stars') params.set('sortBy', newSortBy);
        if (newAuthor) params.set('author', newAuthor);

        const queryString = params.toString();
        router.push(`/marketplace${queryString ? `?${queryString}` : ''}`, { scroll: false });
    };

    // Handle category change
    const handleCategoryChange = (newCategory: string) => {
        setCategory(newCategory);
        setPage(1); // Reset page on filter change
        updateURL(newCategory, sortBy, query, author);
    };

    // Handle sort change
    const handleSortChange = (newSortBy: string) => {
        setSortBy(newSortBy);
        setPage(1); // Reset page on sort change
        updateURL(category, newSortBy, query, author);
    };

    // Handle search change with debounce
    const handleSearchChange = (newQuery: string) => {
        setQuery(newQuery);
        setPage(1); // Reset page on search change
    };

    useEffect(() => {
        const searchSkills = async () => {
            setLoading(true);
            setPage(1); // Reset page on new search
            try {
                const params = new URLSearchParams({
                    search: query,
                    limit: String(LIMIT),
                    sortBy,
                    ...(category && { category }),
                    ...(author && { author }),
                });
                const res = await fetch(`/api/skills?${params}`);
                const data = await res.json();
                setSkills(data.skills || []);
                setTotal(data.total || 0);
            } catch (error) {
                console.error('Failed to fetch skills', error);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(searchSkills, 300);
        return () => clearTimeout(timer);
    }, [query, category, sortBy, author]);

    // Load more skills
    const loadMore = async () => {
        setLoadingMore(true);
        try {
            const params = new URLSearchParams({
                search: query,
                limit: String(LIMIT),
                offset: String(skills.length),
                sortBy,
                ...(category && { category }),
                ...(author && { author }),
            });
            const res = await fetch(`/api/skills?${params}`);
            const data = await res.json();
            setSkills(prev => [...prev, ...(data.skills || [])]);
            setPage(prev => prev + 1);
        } catch (error) {
            console.error('Failed to load more skills', error);
        } finally {
            setLoadingMore(false);
        }
    };

    const copyCommand = (skillName: string) => {
        navigator.clipboard.writeText(`skills install ${skillName}`);
        setCopied(skillName);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30">

            <Navbar />

            <div className="container mx-auto px-6 py-8 max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Browse Skills</h1>
                    <p className="text-zinc-400">Discover and install skills for your AI coding assistant</p>
                </div>

                {/* Search + Filters Bar */}
                <div className="flex flex-col lg:flex-row gap-4 mb-8">
                    {/* Search */}
                    <div className="flex-1 relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-cyan-400 transition-colors">
                            <Search className="size-5" />
                        </div>
                        <Input
                            placeholder="Search 55,000+ skills..."
                            className="w-full pl-12 pr-20 h-12 bg-zinc-900/50 border-white/10 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-base rounded-xl transition-all"
                            value={query}
                            onChange={(e) => handleSearchChange(e.target.value)}
                        />
                        {loading ? (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-500">
                                <Loader2 className="size-5 animate-spin" />
                            </div>
                        ) : (
                            <kbd className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded border border-white/10">
                                ⌘K
                            </kbd>
                        )}
                    </div>

                    {/* Filter Toggle (Mobile) */}
                    <Button
                        variant="outline"
                        className="lg:hidden border-white/10"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter className="size-4 mr-2" />
                        Filters
                        {(category || sortBy !== 'stars') && (
                            <Badge className="ml-2 bg-cyan-500/20 text-cyan-400">Active</Badge>
                        )}
                    </Button>

                    {/* Sort Dropdown */}
                    <div className="hidden lg:flex items-center gap-2">
                        <Button
                            variant="outline"
                            className="border-white/10 h-12 gap-2"
                            onClick={() => {
                                const idx = sortOptions.findIndex(o => o.value === sortBy);
                                handleSortChange(sortOptions[(idx + 1) % sortOptions.length].value);
                            }}
                        >
                            <ArrowUpDown className="size-4" />
                            {sortOptions.find(o => o.value === sortBy)?.label}
                        </Button>
                    </div>
                </div>

                {/* Categories (Desktop) */}
                <div className="hidden lg:flex items-center gap-2 mb-8 flex-wrap">
                    <Button
                        variant={category === '' ? 'default' : 'outline'}
                        size="sm"
                        className={category === ''
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:opacity-90 shadow-lg shadow-cyan-500/25'
                            : 'border-white/10 hover:border-white/30 hover:bg-white/5'
                        }
                        onClick={() => handleCategoryChange('')}
                    >
                        <Package className="size-4 mr-1.5" />
                        All
                    </Button>
                    {categories.map((cat) => {
                        const IconComponent = iconMap[cat.icon] || Package;
                        const colorClass = categoryColors[cat.id] || categoryColors['default'];
                        const isActive = category === cat.id;
                        return (
                            <Button
                                key={cat.id}
                                variant={isActive ? 'default' : 'outline'}
                                size="sm"
                                className={isActive
                                    ? `bg-gradient-to-r ${colorClass} text-white hover:opacity-90 shadow-lg`
                                    : 'border-white/10 hover:border-white/30 hover:bg-white/5'
                                }
                                onClick={() => handleCategoryChange(cat.id)}
                            >
                                <IconComponent className={`size-4 mr-1.5 ${!isActive ? 'opacity-70' : ''}`} />
                                {cat.name}
                                {cat.skill_count > 0 && (
                                    <Badge className={`ml-1.5 text-xs ${isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-zinc-400'}`}>
                                        {cat.skill_count > 1000 ? `${(cat.skill_count / 1000).toFixed(0)}K` : cat.skill_count}
                                    </Badge>
                                )}
                            </Button>
                        );
                    })}

                    {category && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-zinc-400 hover:text-white"
                            onClick={() => handleCategoryChange('')}
                        >
                            <X className="size-4 mr-1" />
                            Clear
                        </Button>
                    )}
                </div>

                {/* Mobile Filters */}
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="lg:hidden mb-8 p-4 bg-zinc-900/50 rounded-xl border border-white/10"
                    >
                        <div className="mb-4">
                            <div className="text-sm text-zinc-400 mb-2">Category</div>
                            <div className="flex flex-wrap gap-2">
                                {categories.map((cat) => (
                                    <Button
                                        key={cat.id}
                                        variant={category === cat.id ? 'default' : 'outline'}
                                        size="sm"
                                        className={category === cat.id
                                            ? 'bg-cyan-500 text-black'
                                            : 'border-white/10'
                                        }
                                        onClick={() => handleCategoryChange(cat.id)}
                                    >
                                        {cat.name}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-zinc-400 mb-2">Sort By</div>
                            <div className="flex flex-wrap gap-2">
                                {sortOptions.map((opt) => (
                                    <Button
                                        key={opt.value}
                                        variant={sortBy === opt.value ? 'default' : 'outline'}
                                        size="sm"
                                        className={sortBy === opt.value
                                            ? 'bg-cyan-500 text-black'
                                            : 'border-white/10'
                                        }
                                        onClick={() => handleSortChange(opt.value)}
                                    >
                                        {opt.label}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Results Count + Active Filters */}
                <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-zinc-400">
                    {loading ? (
                        'Searching...'
                    ) : (
                        <>
                            <span className="text-white font-medium">{total.toLocaleString()}</span> skills found
                            {query && <> for "<span className="text-cyan-400">{query}</span>"</>}
                            {category && <> in <span className="text-cyan-400">{categories.find(c => c.id === category)?.name}</span></>}
                            {author && (
                                <Badge className="bg-purple-500/20 text-purple-400 gap-1 ml-2">
                                    by @{author}
                                    <button
                                        onClick={() => {
                                            setAuthor('');
                                            updateURL(category, sortBy, query, '');
                                        }}
                                        className="ml-1 hover:text-white"
                                    >
                                        <X className="size-3" />
                                    </button>
                                </Badge>
                            )}
                        </>
                    )}
                </div>

                {/* Results Grid */}
                {loading ? (
                    <SkillGridSkeleton count={12} />
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {skills.map((skill, i) => (
                            <motion.div
                                key={skill.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.02 }}
                                className="bg-zinc-900/30 border border-white/5 rounded-xl p-5 hover:border-cyan-500/30 hover:bg-zinc-900/50 transition-all group shimmer relative overflow-hidden"
                            >
                                <Link href={`/marketplace/${skill.scopedName || skill.name}`} className="block">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="font-semibold text-lg text-cyan-100 truncate pr-4 group-hover:text-cyan-400 transition-colors">
                                            {highlightText(skill.name, query)}
                                        </div>
                                        <Badge variant="secondary" className="bg-white/5 text-zinc-400 gap-1 shrink-0 group-hover:bg-yellow-500/10 group-hover:text-yellow-400 transition-colors">
                                            <Star className="size-3 text-yellow-500 fill-yellow-500" />
                                            {skill.stars?.toLocaleString() || 0}
                                        </Badge>
                                    </div>

                                    <p className="text-sm text-zinc-400 mb-4 h-10 overflow-hidden line-clamp-2">
                                        {highlightText(skill.description || `A useful skill for ${skill.name} development.`, query)}
                                    </p>
                                </Link>

                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2">
                                        <img
                                            src={skill.authorAvatar || `https://github.com/${skill.author}.png`}
                                            alt={skill.author}
                                            className="size-5 rounded-full"
                                        />
                                        <span className="text-xs text-zinc-500">{skill.author}</span>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className={`h-8 gap-2 transition-all ${copied === skill.name
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-white/5 hover:bg-cyan-500/20 hover:text-cyan-400 text-zinc-300'
                                            }`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            copyCommand(skill.scopedName || skill.name);
                                        }}
                                    >
                                        {copied === skill.name ? (
                                            <>
                                                <Check className="size-3" />
                                                Copied!
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="size-3" />
                                                Install
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </motion.div>
                        ))}

                        {!loading && skills.length === 0 && (
                            <div className="col-span-full text-center py-20">
                                <Package className="size-12 mx-auto text-zinc-600 mb-4" />
                                <div className="text-zinc-400 mb-2">No skills found</div>
                                <p className="text-sm text-zinc-500">
                                    {query ? `Try a different search term` : 'Check back later for new skills'}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Load More */}
                {skills.length > 0 && skills.length < total && (
                    <div className="text-center mt-12">
                        <Button
                            variant="outline"
                            className="border-white/10 hover:border-cyan-500/30 hover:bg-cyan-500/10 gap-2"
                            onClick={loadMore}
                            disabled={loadingMore}
                        >
                            {loadingMore ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    Loading...
                                </>
                            ) : (
                                <>
                                    Load More Skills
                                    <Badge className="bg-white/10 text-zinc-400">
                                        {skills.length} / {total.toLocaleString()}
                                    </Badge>
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </div>

            {/* Submit Your Skills Repo Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="relative overflow-hidden rounded-2xl border border-zinc-800/50 bg-gradient-to-b from-zinc-900/80 to-black p-8 sm:p-12">
                    {/* Glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-blue-500/10 blur-3xl rounded-full" />
                    <div className="relative z-10">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-blue-400 text-sm font-medium mb-4">
                                <GitBranch className="w-4 h-4" />
                                Community Submissions
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                                Share Your Skills
                            </h2>
                            <p className="text-zinc-400 max-w-md mx-auto">
                                Have a repo with SKILL.md files? Submit it for marketplace indexing — or use the CLI.
                            </p>
                        </div>
                        <SubmitRepoForm />
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}

export default function Marketplace() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <Loader2 className="size-8 animate-spin text-cyan-500" />
            </div>
        }>
            <MarketplaceContent />
        </Suspense>
    );
}
