'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, Zap, Code2, MoveRight, Layers, Workflow, ExternalLink, Shield } from 'lucide-react';

export default function LandingPage() {
    const [scrolled, setScrolled] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener('scroll', handleScroll);
        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '100vh', position: 'relative', overflowX: 'hidden', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            <style jsx global>{`
                ::selection {
                    background: rgba(59, 130, 246, 0.3);
                }
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-15px); }
                    100% { transform: translateY(0px); }
                }
                @keyframes float-delayed {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                    100% { transform: translateY(0px); }
                }
                @keyframes slide-up {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes gradient-text {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .hero-text {
                    background: linear-gradient(to right, var(--text-primary), var(--text-muted), var(--text-primary));
                    background-size: 200% auto;
                    color: transparent;
                    -webkit-background-clip: text;
                    background-clip: text;
                    animation: gradient-text 8s linear infinite;
                }
                .hero-highlight {
                    background: linear-gradient(to right, #60a5fa, #c084fc, #60a5fa);
                    background-size: 200% auto;
                    color: transparent;
                    -webkit-background-clip: text;
                    background-clip: text;
                    animation: gradient-text 4s linear infinite;
                }
                .glass-card {
                    background: var(--bg-card);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid var(--border);
                    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .glass-card:hover {
                    background: var(--bg-hover);
                    border: 1px solid var(--accent);
                    transform: translateY(-4px);
                    box-shadow: 0 10px 40px -10px rgba(0,0,0,0.5);
                }
                .glass-nav {
                    background: var(--bg-primary);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border-bottom: 1px solid var(--border);
                }
                
                
                
                
                .marquee-container {
                    overflow: hidden;
                    white-space: nowrap;
                    position: relative;
                    width: 100%;
                    -webkit-mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
                    mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
                }
                .marquee-content {
                    display: inline-flex;
                    gap: 3rem;
                    animation: marquee 30s linear infinite;
                    padding-right: 3rem;
                }
                .marquee-content:hover {
                    animation-play-state: paused;
                }
                
                /* Custom scrollbar */
                ::-webkit-scrollbar { width: 8px; }
                ::-webkit-scrollbar-track { background: var(--bg-primary); }
                ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
                ::-webkit-scrollbar-thumb:hover { background: #475569; }
            `}</style>

            {/* Ambient Background Glows */}
            <div style={{
                position: 'fixed',
                top: '-20%',
                left: '-10%',
                width: '600px',
                height: '600px',
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
                filter: 'blur(80px)',
                zIndex: 0,
                pointerEvents: 'none'
            }} />
            <div style={{
                position: 'fixed',
                bottom: '-20%',
                right: '-10%',
                width: '600px',
                height: '600px',
                background: 'radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, transparent 70%)',
                filter: 'blur(80px)',
                zIndex: 0,
                pointerEvents: 'none'
            }} />

            {/* Dynamic Mouse Spotlight */}
            <div style={{
                position: 'fixed',
                top: mousePos.y - 300,
                left: mousePos.x - 300,
                width: '600px',
                height: '600px',
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 50%)',
                pointerEvents: 'none',
                zIndex: 1,
            }} />

            {/* Z-Index Wrapper for content */}
            <div style={{ position: 'relative', zIndex: 10 }}>

                {/* Header */}
                <header style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    transition: 'all 0.3s ease',
                    zIndex: 50,
                    backgroundColor: scrolled ? 'var(--bg-card)' : 'transparent',
                    backdropFilter: scrolled ? 'blur(20px)' : 'none',
                    borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent'
                }}>
                    <div style={{
                        maxWidth: '1280px',
                        margin: '0 auto',
                        padding: '16px 24px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '36px',
                                height: '36px',
                                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)'
                            }}>
                                <Mail style={{ width: '18px', height: '18px', color: 'var(--text-primary)' }} />
                            </div>
                            <span style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                                Email Engine
                            </span>
                        </div>

                        <nav className="hidden md:flex gap-10">
                            <button onClick={() => scrollToSection('features')} className="bg-transparent border-none text-[14px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer">Features</button>
                            <button onClick={() => scrollToSection('integrations')} className="bg-transparent border-none text-[14px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer">Integrations</button>
                            <button onClick={() => scrollToSection('pricing')} className="bg-transparent border-none text-[14px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer">Pricing</button>
                        </nav>

                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <Link href="/login" className="hidden sm:inline-block text-[14px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">Sign In</Link>
                            <Link href="/signup" className="btn-premium py-2 px-5 text-sm">
                                Get Started
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Hero Section */}
                <section style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '160px 24px 80px',
                    position: 'relative',
                }}>
                    {/* Grid Background Overlay */}
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
                        backgroundSize: '40px 40px',
                        maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)',
                        WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)',
                        zIndex: -1,
                        pointerEvents: 'none'
                    }} />

                    <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>

                        <div style={{ animation: 'slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '6px 16px',
                                borderRadius: '99px',
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                border: '1px solid rgba(59, 130, 246, 0.2)',
                                marginBottom: '32px',
                            }}>
                                <Zap style={{ width: '14px', height: '14px', color: '#60a5fa' }} />
                                <span style={{ fontSize: '13px', fontWeight: 500, color: '#93c5fd' }}>v2.0 Early Access is now live</span>
                            </div>

                            <h1 style={{
                                fontSize: 'clamp(48px, 6vw, 84px)',
                                fontWeight: 700,
                                letterSpacing: '-0.03em',
                                lineHeight: '1.05',
                                marginBottom: '24px',
                                color: 'var(--text-primary)'
                            }}>
                                Automate emails like <br />
                                <span className="hero-highlight">absolute magic.</span>
                            </h1>

                            <p style={{
                                fontSize: 'clamp(18px, 2vw, 22px)',
                                color: 'var(--text-muted)',
                                maxWidth: '700px',
                                margin: '0 auto 48px auto',
                                lineHeight: '1.6',
                                fontWeight: 400
                            }}>
                                The developer-first infrastructure for event-driven communications. Build complex workflows, personalize templates, and deliver at scale in minutes.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-5 items-center justify-center mb-20 w-full px-6 sm:px-0">
                                <Link href="/signup" className="btn-premium w-full sm:w-auto h-12 text-base font-semibold px-8 rounded-xl shadow-[0_4px_14px_rgba(37,99,235,0.39)]">
                                    Get Started Free
                                    <MoveRight className="w-[18px] h-[18px]" />
                                </Link>
                                <Link href="/docs" className="glass-card w-full sm:w-auto text-center" style={{
                                    fontSize: '16px',
                                    fontWeight: 500,
                                    color: 'var(--text-primary)',
                                    padding: '16px 32px',
                                    borderRadius: '12px',
                                    textDecoration: 'none',
                                }}>
                                    Read Documentation
                                </Link>
                            </div>
                        </div>

                        {/* Hero Visual - Floating Terminal */}
                        <div className="w-full max-w-[900px] mx-auto px-4 sm:px-6 md:px-8 opacity-0 animate-[slide-up_1s_cubic-bezier(0.16,1,0.3,1)_0.2s_forwards]" style={{ perspective: '1000px' }}>
                            <div className="glass-card" style={{
                                padding: '0',
                                borderRadius: '20px',
                                animation: 'float 8s ease-in-out infinite',
                                overflow: 'hidden',
                                boxShadow: '0 30px 60px -15px rgba(0,0,0,0.8), 0 0 40px rgba(59, 130, 246, 0.1)',
                                border: '1px solid var(--border)'
                            }}>
                                {/* Mac Window Header */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 20px', backgroundColor: 'rgba(0,0,0,0.4)', borderBottom: '1px solid var(--border)' }}>
                                    <div style={{ width: 12, height: 12, borderRadius: 6, background: '#ef4444' }} />
                                    <div style={{ width: 12, height: 12, borderRadius: 6, background: '#f59e0b' }} />
                                    <div style={{ width: 12, height: 12, borderRadius: 6, background: '#10b981' }} />
                                    <div style={{ marginLeft: '12px', fontSize: '13px', color: '#64748b', fontFamily: 'monospace' }}>api/trigger-campaign.ts</div>
                                </div>
                                {/* Terminal Body */}
                                <div className="p-4 sm:p-8 overflow-x-auto" style={{ fontFamily: '"JetBrains Mono", "Fira Code", monospace', fontSize: '14px', lineHeight: '1.7', color: '#cbd5e1', textAlign: 'left', backgroundColor: '#0f172a' }}>
                                    <div className="whitespace-pre"><span style={{ color: '#c084fc' }}>import</span> {'{ Engine }'} <span style={{ color: '#c084fc' }}>from</span> <span style={{ color: '#34d399' }}>'@email-engine/sdk'</span>;</div>
                                    <br />
                                    <div className="whitespace-pre"><span style={{ color: '#60a5fa' }}>const</span> app = <span style={{ color: '#fbbf24' }}>new</span> <span style={{ color: '#60a5fa' }}>Engine</span>(process.env.API_KEY);</div>
                                    <br />
                                    <div className="whitespace-pre">app.<span style={{ color: '#60a5fa' }}>on</span>(<span style={{ color: '#34d399' }}>'user.signup'</span>, <span style={{ color: '#c084fc' }}>async</span> (event) {'=>'} {'{'}</div>
                                    <div className="whitespace-pre" style={{ paddingLeft: '24px' }}>
                                        <span style={{ color: '#c084fc' }}>await</span> app.<span style={{ color: '#60a5fa' }}>campaigns</span>.<span style={{ color: '#60a5fa' }}>trigger</span>({'{'}
                                    </div>
                                    <div className="whitespace-pre" style={{ paddingLeft: '48px', color: '#cbd5e1' }}>workflowId: <span style={{ color: '#34d399' }}>'wfl_welcome_series'</span>,</div>
                                    <div className="whitespace-pre" style={{ paddingLeft: '48px', color: '#cbd5e1' }}>contact: event.user.email,</div>
                                    <div className="whitespace-pre" style={{ paddingLeft: '48px', color: '#cbd5e1' }}>data: {'{'}</div>
                                    <div className="whitespace-pre" style={{ paddingLeft: '72px', color: '#93c5fd' }}>name: event.user.firstName,</div>
                                    <div className="whitespace-pre" style={{ paddingLeft: '72px', color: '#93c5fd' }}>trialEnds: event.user.trialEndDate</div>
                                    <div className="whitespace-pre" style={{ paddingLeft: '48px' }}>{'}'}</div>
                                    <div className="whitespace-pre" style={{ paddingLeft: '24px' }}>{'}'});</div>
                                    <br />
                                    <div className="whitespace-pre" style={{ paddingLeft: '24px', color: '#64748b' }}>// ✨ Email delivered instantly</div>
                                    <div className="whitespace-pre">{'}'});</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Marquee Integrations Section */}
                <section id="integrations" style={{ padding: '40px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-hover)' }}>
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Integrates with your modern stack</p>
                    </div>
                    <div className="marquee-container">
                        <div className="marquee-content">
                            {/* Duplicated for infinite scroll effect */}
                            {[...Array(4)].map((_, i) => (
                                <div key={i} style={{ display: 'flex', gap: '4rem', alignItems: 'center' }}>
                                    {['Node.js', 'Python', 'React', 'Shopify', 'Webhook', 'Stripe', 'Segment', 'Next.js'].map((logo, j) => (
                                        <div key={`${i}-${j}`} style={{ fontSize: '24px', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <Layers style={{ color: '#475569', width: '28px', height: '28px' }} />
                                            {logo}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Bento Grid Features Section */}
                <section id="features" style={{ padding: '160px 24px', maxWidth: '1280px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                        <h2 style={{ fontSize: '48px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '24px', letterSpacing: '-0.02em' }}>
                            Everything you <span style={{ color: '#60a5fa' }}>need</span>, <br />nothing you don't.
                        </h2>
                        <p style={{ fontSize: '18px', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
                            We striped away the bloated marketing tools to give developers a powerful, headless email engine.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">

                        {/* Box 1 */}
                        <div className="glass-card sm:col-span-12 md:col-span-8 p-8 md:p-12 rounded-[32px] flex flex-col justify-between hover:scale-[1.02] transition-transform animate-[float-delayed_7s_ease-in-out_infinite]">
                            <div>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(96, 165, 250, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', border: '1px solid rgba(96, 165, 250, 0.2)' }}>
                                    <Workflow style={{ width: '24px', height: '24px', color: '#60a5fa' }} />
                                </div>
                                <h3 className="text-2xl md:text-3xl font-semibold text-[var(--text-primary)] mb-4">Visual Automation Builder</h3>
                                <p style={{ fontSize: '16px', color: 'var(--text-muted)', lineHeight: '1.6', maxWidth: '400px' }}>
                                    Design complex journeys with a drag-and-drop workflow canvas. Set delays, rules, and conditions without touching the code.
                                </p>
                            </div>
                        </div>

                        {/* Box 2 */}
                        <div className="glass-card sm:col-span-6 md:col-span-4 p-8 md:p-12 rounded-[32px] flex flex-col justify-between hover:scale-[1.02] transition-transform">
                            <div>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                                    <Code2 style={{ width: '24px', height: '24px', color: '#c084fc' }} />
                                </div>
                                <h3 className="text-xl md:text-2xl font-semibold text-[var(--text-primary)] mb-4">Developer API</h3>
                                <p style={{ fontSize: '16px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                                    RESTful endpoints with predictable payloads and comprehensive webhooks.
                                </p>
                            </div>
                        </div>

                        {/* Box 3 */}
                        <div className="glass-card sm:col-span-6 md:col-span-4 p-8 md:p-12 rounded-[32px] flex flex-col justify-between hover:scale-[1.02] transition-transform">
                            <div>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                    <Shield style={{ width: '24px', height: '24px', color: '#34d399' }} />
                                </div>
                                <h3 className="text-xl md:text-2xl font-semibold text-[var(--text-primary)] mb-4">Multi-Tenant Security</h3>
                                <p style={{ fontSize: '16px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                                    Isolated workspaces out of the box. Safe for B2B SaaS applications.
                                </p>
                            </div>
                        </div>

                        {/* Box 4 */}
                        <div className="glass-card sm:col-span-12 md:col-span-8 p-8 md:p-12 rounded-[32px] flex flex-col justify-between hover:scale-[1.02] transition-transform animate-[float_9s_ease-in-out_infinite]">
                            <div>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(251, 191, 36, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                                    <Zap style={{ width: '24px', height: '24px', color: '#fbbf24' }} />
                                </div>
                                <h3 className="text-2xl md:text-3xl font-semibold text-[var(--text-primary)] mb-4">Real-time Delivery Pipeline</h3>
                                <p style={{ fontSize: '16px', color: 'var(--text-muted)', lineHeight: '1.6', maxWidth: '400px' }}>
                                    Our Rust-based ingest servers and Redis queues ensure sub-millisecond event processing and reliable email dispatch even during massive spikes.
                                </p>
                            </div>
                        </div>

                    </div>
                </section>

                {/* Final CTA */}
                <section style={{ padding: '160px 24px', textAlign: 'center', position: 'relative' }}>
                    <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
                        <h2 style={{ fontSize: '56px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '32px', letterSpacing: '-0.02em' }}>
                            Ready to upgrade your stack?
                        </h2>
                        <p style={{ fontSize: '20px', color: 'var(--text-muted)', marginBottom: '48px' }}>
                            Join hundreds of developers building the future of automated communications.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-5 justify-center w-full px-6 sm:px-0">
                            <Link href="/signup" className="btn-premium w-full sm:w-auto h-12 text-base font-semibold px-8 rounded-xl shadow-[0_4px_14px_rgba(37,99,235,0.39)]">
                                Get Started for Free
                                <MoveRight className="w-[18px] h-[18px]" />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-[var(--border)] py-16 px-6 bg-[var(--bg-card)]">
                    <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12">
                        <div>
                            <div className="flex items-center gap-2 mb-6">
                                <Mail className="w-4 h-4 text-blue-400" />
                                <span className="text-base font-semibold text-[var(--text-primary)]">Email Engine</span>
                            </div>
                            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                                The modern infrastructure for event-driven email automation.
                            </p>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-5">Product</h4>
                            <div className="flex flex-col gap-3">
                                <Link href="#" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">Features</Link>
                                <Link href="#" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">Integrations</Link>
                                <Link href="#" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">Pricing</Link>
                                <Link href="#" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">Changelog</Link>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-5">Developers</h4>
                            <div className="flex flex-col gap-3">
                                <Link href="/docs" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">Documentation</Link>
                                <Link href="#" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">API Reference</Link>
                                <a href="https://github.com" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1.5">
                                    GitHub <ExternalLink className="w-3 h-3" />
                                </a>
                                <Link href="#" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">Status</Link>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-5">Company</h4>
                            <div className="flex flex-col gap-3">
                                <Link href="#" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">About</Link>
                                <Link href="#" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">Blog</Link>
                                <Link href="#" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">Contact</Link>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-[var(--border)] flex justify-between items-center sm:flex-row flex-col gap-4">
                        <p className="text-sm text-[var(--text-muted)]">© 2026 Email Engine Inc. All rights reserved.</p>
                        <div className="flex gap-6">
                            <Link href="#" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">Privacy</Link>
                            <Link href="#" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">Terms</Link>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
