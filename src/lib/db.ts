import type { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Prisma can't run its native engine in a Worker, so we use the pg driver adapter.
// Connection string comes from the Hyperdrive binding at runtime (pooled, in-Worker),
// or DATABASE_URL for local dev and `next build` (generateStaticParams / sitemap).
// Init is lazy: the Hyperdrive binding only exists inside request scope, not at module load.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function resolveConnection(): { url: string; viaHyperdrive: boolean } {
    try {
        // Only resolves inside a Cloudflare request; throws during build/local Node.
        const { getCloudflareContext } = require('@opennextjs/cloudflare');
        const cs = getCloudflareContext()?.env?.HYPERDRIVE?.connectionString;
        if (cs) return { url: cs, viaHyperdrive: true };
    } catch {
        // not in a Worker request context — fall through to env
    }
    return { url: process.env.DATABASE_URL as string, viaHyperdrive: false };
}

function createClient(): PrismaClient {
    let { url, viaHyperdrive } = resolveConnection();
    // ponytail: direct RDS at build encrypts but skips CA verify (AWS RDS CA not in Node trust
    // chain). sslmode lives IN the string and overrides a separate ssl option, so rewrite it here.
    // Hyperdrive terminates TLS to RDS itself at runtime — leave its connection string alone.
    if (!viaHyperdrive) {
        url = /[?&]sslmode=/.test(url)
            ? url.replace(/sslmode=[^&]*/, 'sslmode=no-verify')
            : url + (url.includes('?') ? '&' : '?') + 'sslmode=no-verify';
    }
    const adapter = new PrismaPg(new Pool({ connectionString: url }));
    // Workers forbid eval, so the Node library engine (needs libssl + eval) can't run there.
    // Pick the WASM engine in workerd, the library engine in Node build. Static requires so
    // esbuild bundles both; only one branch executes per environment.
    const isWorkers =
        typeof navigator !== 'undefined' && navigator.userAgent === 'Cloudflare-Workers';
    const { PrismaClient } = isWorkers
        ? require('@prisma/client/wasm')
        : require('@prisma/client');
    return new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
}

// Lazy singleton: defer createClient() until the first DB access so Hyperdrive is available.
export const prisma: PrismaClient =
    globalForPrisma.prisma ??
    new Proxy({} as PrismaClient, {
        get(_t, prop) {
            const client = (globalForPrisma.prisma ??= createClient());
            const value = (client as unknown as Record<string | symbol, unknown>)[prop];
            return typeof value === 'function' ? value.bind(client) : value;
        },
    });

export default prisma;
