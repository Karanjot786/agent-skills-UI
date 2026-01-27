import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

/**
 * Telemetry API Endpoint
 * 
 * Receives anonymous usage data from the CLI.
 * Data is stored for analytics purposes only.
 * 
 * Query params:
 * - event: install | search | check | update | command
 * - v: CLI version
 * - ci: "1" if running in CI
 * - skill: Skill name (for install events)
 * - agent: Agent name (for install events)
 * - query: Search query (for search events)
 * - resultCount: Number of results (for search events)
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    const event = searchParams.get('event');
    const version = searchParams.get('v');
    const isCI = searchParams.get('ci') === '1';

    // Don't process if no event
    if (!event) {
        return new Response('ok', { status: 200 });
    }

    try {
        // Build metadata object from all params
        const metadata: Record<string, string> = {};
        searchParams.forEach((value, key) => {
            if (key !== 'event' && key !== 'v' && key !== 'ci') {
                metadata[key] = value;
            }
        });

        // Store telemetry event
        await prisma.telemetry_events.create({
            data: {
                event,
                version: version || 'unknown',
                isCI,
                metadata: JSON.stringify(metadata),
            },
        });

        return new Response('ok', { status: 200 });
    } catch (error) {
        // Silently fail - telemetry should never break
        console.error('Telemetry error:', error);
        return new Response('ok', { status: 200 });
    }
}

// Also support POST for future compatibility
export async function POST(request: Request) {
    try {
        const body = await request.json();

        const event = body.event;
        const version = body.v || body.version;
        const isCI = body.ci === '1' || body.ci === true;

        if (!event) {
            return new Response('ok', { status: 200 });
        }

        // Remove known fields to get metadata
        const { event: _, v: __, version: ___, ci: ____, ...metadata } = body;

        await prisma.telemetry_events.create({
            data: {
                event,
                version: version || 'unknown',
                isCI,
                metadata: JSON.stringify(metadata),
            },
        });

        return new Response('ok', { status: 200 });
    } catch (error) {
        console.error('Telemetry error:', error);
        return new Response('ok', { status: 200 });
    }
}
