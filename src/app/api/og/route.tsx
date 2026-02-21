import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title') || 'Agent Skills CLI';
    const description = searchParams.get('description') || 'The Package Manager for AI Agent Skills';

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#000',
                    backgroundImage: 'radial-gradient(circle at 50% 50%, #0a2540 0%, #000 70%)',
                    fontFamily: 'system-ui, sans-serif',
                }}
            >
                {/* Glow effects */}
                <div
                    style={{
                        position: 'absolute',
                        top: '20%',
                        left: '30%',
                        width: '300px',
                        height: '300px',
                        background: 'rgba(34, 211, 238, 0.15)',
                        borderRadius: '50%',
                        filter: 'blur(80px)',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        bottom: '20%',
                        right: '30%',
                        width: '250px',
                        height: '250px',
                        background: 'rgba(59, 130, 246, 0.15)',
                        borderRadius: '50%',
                        filter: 'blur(80px)',
                    }}
                />

                {/* Terminal prompt */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '24px',
                        padding: '12px 24px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                >
                    <span style={{ color: '#22d3ee', fontSize: '28px', marginRight: '12px' }}>$</span>
                    <span style={{ color: '#fff', fontSize: '28px', fontFamily: 'monospace' }}>
                        npm install -g agent-skills-cli
                    </span>
                </div>

                {/* Main title */}
                <div
                    style={{
                        fontSize: '72px',
                        fontWeight: 'bold',
                        color: '#fff',
                        marginBottom: '16px',
                        textAlign: 'center',
                    }}
                >
                    {title}
                </div>

                {/* Description */}
                <div
                    style={{
                        fontSize: '32px',
                        color: '#a1a1aa',
                        marginBottom: '40px',
                        textAlign: 'center',
                    }}
                >
                    {description}
                </div>

                {/* Agents */}
                <div
                    style={{
                        display: 'flex',
                        gap: '24px',
                        alignItems: 'center',
                    }}
                >
                    {['Claude', 'Cursor', 'Copilot', 'Antigravity', 'Codex'].map((agent, i) => (
                        <div
                            key={i}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '8px 16px',
                                backgroundColor: 'rgba(34, 211, 238, 0.1)',
                                borderRadius: '8px',
                                border: '1px solid rgba(34, 211, 238, 0.3)',
                            }}
                        >
                            <span style={{ color: '#22d3ee', fontSize: '20px' }}>{agent}</span>
                        </div>
                    ))}
                </div>

                {/* Stats */}
                <div
                    style={{
                        display: 'flex',
                        gap: '48px',
                        marginTop: '40px',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#22d3ee', fontSize: '28px', fontWeight: 'bold' }}>175,000+</span>
                        <span style={{ color: '#71717a', fontSize: '20px' }}>Skills</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#a855f7', fontSize: '28px', fontWeight: 'bold' }}>7,000+</span>
                        <span style={{ color: '#71717a', fontSize: '20px' }}>Contributors</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#22c55e', fontSize: '28px', fontWeight: 'bold' }}>100%</span>
                        <span style={{ color: '#71717a', fontSize: '20px' }}>Open Source</span>
                    </div>
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 630,
        }
    );
}
