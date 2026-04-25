'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Code2,
  ExternalLink,
  Layers,
  Mail,
  MoveRight,
  Shield,
  Sparkles,
  Workflow,
  Zap,
} from 'lucide-react';

const integrations = ['Node.js', 'Python', 'React', 'Shopify', 'Stripe', 'Segment', 'Next.js', 'Webhook'];

const featureCards = [
  {
    title: 'Campaign orchestration that feels operational, not chaotic',
    description:
      'Schedule sends, manage approvals, and spot deliverability risk before it becomes a support incident.',
    icon: Workflow,
    accent: 'text-[var(--accent)]',
    tint: 'bg-[var(--accent)]/10 border-[var(--accent)]/20',
    className: 'md:col-span-7',
  },
  {
    title: 'API-first infrastructure',
    description:
      'Build on predictable primitives with scoped keys, logs, webhooks, and sending controls your engineering team can trust.',
    icon: Code2,
    accent: 'text-[var(--ai-accent)]',
    tint: 'bg-[var(--ai-accent)]/10 border-[var(--ai-accent)]/20',
    className: 'md:col-span-5',
  },
  {
    title: 'Compliance and domain health built in',
    description:
      'Keep sending safe with workspace controls, suppression handling, and DNS visibility that stays readable.',
    icon: Shield,
    accent: 'text-[var(--success)]',
    tint: 'bg-[var(--success)]/10 border-[var(--success)]/20',
    className: 'md:col-span-5',
  },
  {
    title: 'One surface for contacts, templates, campaigns, and analytics',
    description:
      'Sh_R_Mail is designed as a connected system, so the next action is always close to the signal that triggered it.',
    icon: Zap,
    accent: 'text-[var(--warning)]',
    tint: 'bg-[var(--warning)]/10 border-[var(--warning)]/20',
    className: 'md:col-span-7',
  },
];

const pricingTiers = [
  {
    name: 'Starter',
    price: '$49',
    description: 'For small product teams launching their first reliable sending setup.',
    bullets: ['Up to 25k monthly sends', 'Contacts and suppression controls', 'Domain verification and API keys'],
  },
  {
    name: 'Growth',
    price: '$199',
    description: 'For B2B teams running campaigns, analytics, and tenant-level infrastructure.',
    bullets: ['Advanced campaign orchestration', 'Deliverability monitoring', 'Team roles and operational controls'],
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For high-volume organizations needing tighter governance and scale planning.',
    bullets: ['Custom limits and support', 'Governance and compliance workflows', 'Shared rollout planning'],
  },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    const handleMouseMove = (event: MouseEvent) => setMousePos({ x: event.clientX, y: event.clientY });

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <style jsx global>{`
        @keyframes marketing-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes marketing-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marketing-float {
          animation: marketing-float 8s ease-in-out infinite;
        }
        .marketing-marquee {
          animation: marketing-marquee 26s linear infinite;
        }
        .marketing-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-12rem] top-[-8rem] h-[28rem] w-[28rem] rounded-full bg-[var(--accent)]/12 blur-3xl" />
        <div className="absolute bottom-[-12rem] right-[-8rem] h-[30rem] w-[30rem] rounded-full bg-[var(--ai-accent)]/12 blur-3xl" />
        <div
          className="absolute h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(37,88,217,0.10)_0%,rgba(37,88,217,0)_68%)] blur-2xl transition-transform duration-200"
          style={{ transform: `translate(${mousePos.x - 220}px, ${mousePos.y - 220}px)` }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0)_0%,rgba(15,23,42,0.03)_100%)] dark:bg-[linear-gradient(to_bottom,rgba(255,255,255,0)_0%,rgba(255,255,255,0.02)_100%)]" />
      </div>

      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'border-b border-[var(--border)] bg-[var(--bg-card)]/95 backdrop-blur-xl'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent-gradient)] text-white shadow-[var(--shadow-lg)]">
              <Mail className="h-5 w-5" />
            </span>
            <span className="text-base font-semibold tracking-tight text-[var(--text-primary)]">Sh_R_Mail</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <button onClick={() => scrollToSection('features')} className="text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]">Features</button>
            <button onClick={() => scrollToSection('integrations')} className="text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]">Integrations</button>
            <button onClick={() => scrollToSection('pricing')} className="text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]">Pricing</button>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] sm:inline-flex">
              Sign in
            </Link>
            <Link href="/signup" className="btn-premium px-5 py-2 text-sm">
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="px-4 pb-16 pt-32 sm:px-6 lg:px-8 lg:pb-24 lg:pt-40">
          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/10 px-4 py-2 text-sm font-medium text-[var(--accent)]">
                <Sparkles className="h-4 w-4" />
                Premium B2B email operations, finally in one place
              </div>

              <div className="space-y-6">
                <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.04em] text-[var(--text-primary)] sm:text-6xl lg:text-7xl">
                  Email infrastructure with the calm of a product, not the chaos of a toolkit.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-[var(--text-muted)] sm:text-lg">
                  Sh_R_Mail gives modern teams one premium workspace for contacts, templates, campaign orchestration,
                  analytics, and tenant-level infrastructure. It is built to feel elegant in daily use and dependable when volume rises.
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Link href="/signup" className="btn-premium h-12 px-8 text-base font-semibold">
                  Start free
                  <MoveRight className="h-4 w-4" />
                </Link>
                <Link href="/docs" className="inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] px-8 text-base font-medium text-[var(--text-primary)] shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--bg-hover)]">
                  Read docs
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-sm)]">
                  <p className="text-2xl font-semibold text-[var(--text-primary)]">99.9%</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">Reliable delivery operations across campaigns and triggered mail.</p>
                </div>
                <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-sm)]">
                  <p className="text-2xl font-semibold text-[var(--text-primary)]">10M+</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">Messages processed through production-grade infrastructure patterns.</p>
                </div>
                <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-sm)]">
                  <p className="text-2xl font-semibold text-[var(--text-primary)]">1 system</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">Contacts, campaigns, analytics, and compliance working together.</p>
                </div>
              </div>
            </div>

            <div className="marketing-float">
              <div className="overflow-hidden rounded-[28px] border border-[var(--border-highlight)] bg-[var(--bg-card)] shadow-[var(--shadow-card)]">
                <div className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--bg-hover)] px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-[#ef4444]" />
                    <span className="h-3 w-3 rounded-full bg-[#f59e0b]" />
                    <span className="h-3 w-3 rounded-full bg-[#10b981]" />
                  </div>
                  <span className="ml-2 text-xs font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">Campaign preflight</span>
                </div>

                <div className="space-y-6 bg-[#0f172a] p-6 text-left text-sm text-slate-200 sm:p-8">
                  <div className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Deployment state</p>
                        <h2 className="mt-2 text-xl font-semibold text-white">Spring product launch</h2>
                      </div>
                      <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                        Ready to send
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Audience</p>
                      <p className="mt-3 text-2xl font-semibold text-white">48,210</p>
                      <p className="mt-2 text-sm text-slate-400">Suppression and invalid contacts already filtered out.</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Domain health</p>
                      <p className="mt-3 text-2xl font-semibold text-white">Verified</p>
                      <p className="mt-2 text-sm text-slate-400">SPF, DKIM, and compliance checks passing.</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 font-mono text-[13px] leading-7 text-slate-300">
                    <div><span className="text-sky-300">campaign</span>.<span className="text-indigo-300">send</span>({'{'}</div>
                    <div className="pl-6">template: <span className="text-emerald-300">'spring-launch'</span>,</div>
                    <div className="pl-6">segment: <span className="text-emerald-300">'active-buyers'</span>,</div>
                    <div className="pl-6">scheduleAt: <span className="text-amber-300">'2026-04-29T14:00:00Z'</span>,</div>
                    <div className="pl-6">deliverabilityGuard: <span className="text-sky-300">true</span>,</div>
                    <div>{'}'});</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="integrations" className="border-y border-[var(--border)] bg-[var(--bg-hover)]/70 py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Integrates with the stack your team already uses
            </p>
            <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
              <div className="marketing-marquee flex w-max gap-12 pr-12">
                {[...integrations, ...integrations, ...integrations].map((item, index) => (
                  <div key={`${item}-${index}`} className="flex items-center gap-3 text-lg font-semibold text-[var(--text-secondary)]">
                    <Layers className="h-5 w-5 text-[var(--accent)]" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Whole product thinking</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-[var(--text-primary)] sm:text-5xl">
                Powerful enough for infrastructure, clear enough for everyday work.
              </h2>
              <p className="mt-6 text-base leading-8 text-[var(--text-muted)] sm:text-lg">
                We removed the feeling of bolted-together tools and replaced it with one operating system for professional email teams.
              </p>
            </div>

            <div className="mt-16 grid gap-6 md:grid-cols-12">
              {featureCards.map((feature) => {
                const Icon = feature.icon;

                return (
                  <article
                    key={feature.title}
                    className={`rounded-[28px] border border-[var(--border)] bg-[var(--bg-card)] p-8 shadow-[var(--shadow-card)] transition-transform duration-300 hover:-translate-y-1 ${feature.className}`}
                  >
                    <div className={`mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl border ${feature.tint}`}>
                      <Icon className={`h-5 w-5 ${feature.accent}`} />
                    </div>
                    <h3 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">{feature.title}</h3>
                    <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-muted)] sm:text-base">{feature.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="pricing" className="px-4 pb-24 sm:px-6 lg:px-8 lg:pb-32">
          <div className="mx-auto max-w-7xl rounded-[32px] border border-[var(--border)] bg-[var(--bg-card)] px-6 py-10 shadow-[var(--shadow-card)] sm:px-8 sm:py-12 lg:px-12">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Pricing</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">Pricing that scales with operational complexity.</h2>
              <p className="mt-5 text-base leading-8 text-[var(--text-muted)] sm:text-lg">
                Start simple, then grow into stronger orchestration, analytics, and infrastructure controls as your email program matures.
              </p>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {pricingTiers.map((tier) => (
                <article
                  key={tier.name}
                  className={`rounded-[24px] border p-6 ${tier.featured ? 'border-[var(--accent)] bg-[var(--accent)]/8 shadow-[var(--shadow-lg)]' : 'border-[var(--border)] bg-[var(--bg-primary)]'}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-[var(--text-primary)]">{tier.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{tier.description}</p>
                    </div>
                    {tier.featured && (
                      <span className="rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                        Most used
                      </span>
                    )}
                  </div>
                  <p className="mt-8 text-4xl font-semibold tracking-tight text-[var(--text-primary)]">{tier.price}<span className="ml-2 text-sm font-medium text-[var(--text-muted)]">/ month</span></p>
                  <ul className="mt-8 space-y-3 text-sm leading-6 text-[var(--text-muted)]">
                    {tier.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-3">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-24 sm:px-6 lg:px-8 lg:pb-32">
          <div className="mx-auto max-w-5xl rounded-[32px] border border-[var(--border)] bg-[linear-gradient(135deg,rgba(37,88,217,0.14),rgba(15,159,140,0.10))] px-6 py-16 text-center shadow-[var(--shadow-card)] sm:px-10">
            <h2 className="text-4xl font-semibold tracking-[-0.03em] text-[var(--text-primary)] sm:text-5xl">
              Ready to give your email stack a calmer control surface?
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[var(--text-muted)] sm:text-lg">
              Start with a workspace that already thinks in campaigns, deliverability, infrastructure, and team operations.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <Link href="/signup" className="btn-premium h-12 px-8 text-base font-semibold">
                Get started for free
                <MoveRight className="h-4 w-4" />
              </Link>
              <Link href="/docs" className="inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] px-8 text-base font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-hover)]">
                Explore docs
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-[var(--border)] bg-[var(--bg-card)]/85 py-16 backdrop-blur-sm">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--accent-gradient)] text-white">
                <Mail className="h-4 w-4" />
              </span>
              <span className="text-base font-semibold text-[var(--text-primary)]">Sh_R_Mail</span>
            </div>
            <p className="text-sm leading-7 text-[var(--text-muted)]">
              Premium email marketing and infrastructure for modern B2B teams.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--text-primary)]">Product</h4>
            <div className="mt-5 flex flex-col gap-3">
              <button onClick={() => scrollToSection('features')} className="text-left text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]">Features</button>
              <button onClick={() => scrollToSection('integrations')} className="text-left text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]">Integrations</button>
              <button onClick={() => scrollToSection('pricing')} className="text-left text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]">Pricing</button>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--text-primary)]">Developers</h4>
            <div className="mt-5 flex flex-col gap-3">
              <Link href="/docs" className="text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]">Documentation</Link>
              <Link href="/integrations" className="text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]">Integrations</Link>
              <a href="https://github.com" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]">
                GitHub
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--text-primary)]">Access</h4>
            <div className="mt-5 flex flex-col gap-3">
              <Link href="/login" className="text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]">Sign in</Link>
              <Link href="/signup" className="text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]">Create account</Link>
              <Link href="/forgot-password" className="text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]">Reset password</Link>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-14 flex max-w-7xl flex-col gap-4 border-t border-[var(--border)] px-4 pt-8 text-sm text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© 2026 Sh_R_Mail. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/login" className="transition-colors hover:text-[var(--text-primary)]">Privacy</Link>
            <Link href="/login" className="transition-colors hover:text-[var(--text-primary)]">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
