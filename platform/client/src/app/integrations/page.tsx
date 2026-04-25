'use client';

import { useState } from 'react';
import { ArrowRight, Code, Database, GitBranch, Globe, Layers, Package, RefreshCw, Server, Settings, ShoppingBag, Zap } from 'lucide-react';
import { Badge, Button, InlineAlert, PageHeader, SectionCard, StatCard } from '@/components/ui';

export default function IntegrationsPage() {
    const [hoveredNode, setHoveredNode] = useState<number | null>(null);

    const integrations = [
        { id: 1, name: 'Shopify Store', icon: ShoppingBag, status: 'Active', eventsToday: 124, lastEvent: '2 minutes ago' },
        { id: 2, name: 'Wix Website', icon: Globe, status: 'Active', eventsToday: 89, lastEvent: '5 minutes ago' },
        { id: 3, name: 'Web Application', icon: Code, status: 'Active', eventsToday: 456, lastEvent: '1 minute ago' },
        { id: 4, name: 'Public API', icon: Server, status: 'Active', eventsToday: 1203, lastEvent: '30 seconds ago' },
    ];

    const flowNodes = [
        { id: 1, title: 'API Gateway', icon: Server, description: 'Receives events securely from integrations.', footer: 'Auth • Validation • Rate Limit' },
        { id: 2, title: 'Event Normalizer', icon: GitBranch, description: 'Converts incoming data into a standard event format.', footer: 'Unified Event Schema' },
        { id: 3, title: 'Event Store', icon: Database, description: 'Persistent storage for normalized events.', footer: 'Append-only' },
        { id: 4, title: 'Rule Engine', icon: Zap, description: 'Evaluates events against automation rules.', footer: 'Triggers & Conditions' },
        { id: 5, title: 'Message Queue', icon: Layers, description: 'Buffers actions for reliable delivery.', footer: 'Retry • Backoff' },
    ];

    return (
        <div className="space-y-8 pb-8">
            <PageHeader
                title="Integrations"
                subtitle="Visualize how external event sources move through your automation and delivery pipeline before they trigger campaigns."
                action={
                    <div className="flex gap-3">
                        <Button variant="outline"><RefreshCw className="mr-2 h-4 w-4" />Refresh Flow</Button>
                        <Button variant="outline"><Settings className="h-4 w-4" /></Button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <StatCard label="Active Sources" value={integrations.length.toString()} icon={<Globe className="h-5 w-5" />} />
                <StatCard label="Events Today" value="12,482" icon={<Zap className="h-5 w-5" />} />
                <StatCard label="Queue Backlog" value="0" icon={<Layers className="h-5 w-5" />} />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1.3fr_1fr]">
                <SectionCard title="Data Sources" description="External systems currently sending events into your platform.">
                    <div className="space-y-3">
                        {integrations.map((integration) => {
                            const Icon = integration.icon;
                            return (
                                <div key={integration.id} className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-primary)] p-4">
                                    <div className="mb-3 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-hover)] text-[var(--accent)]">
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-[var(--text-primary)]">{integration.name}</p>
                                                <p className="text-xs text-[var(--text-muted)]">Last event: {integration.lastEvent}</p>
                                            </div>
                                        </div>
                                        <Badge variant="success">{integration.status}</Badge>
                                    </div>
                                    <p className="text-sm text-[var(--text-muted)]">Events today: {integration.eventsToday}</p>
                                </div>
                            );
                        })}
                    </div>
                    <Button variant="outline" fullWidth className="mt-4">Add Integration</Button>
                </SectionCard>

                <SectionCard title="Event Processing Pipeline" description="Every event passes through the same standardized flow before it becomes campaign work.">
                    <div className="space-y-4">
                        {flowNodes.map((node, index) => {
                            const Icon = node.icon;
                            const isHovered = hoveredNode === node.id;
                            const isBeforeHovered = hoveredNode !== null && node.id <= hoveredNode;
                            return (
                                <div key={node.id}>
                                    <button
                                        type="button"
                                        onMouseEnter={() => setHoveredNode(node.id)}
                                        onMouseLeave={() => setHoveredNode(null)}
                                        className={`w-full rounded-[var(--radius)] border p-4 text-left transition ${isHovered ? 'bg-[var(--bg-hover)]' : 'bg-[var(--bg-primary)]'} ${isBeforeHovered ? 'border-[var(--accent)]' : 'border-[var(--border)]'}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${isBeforeHovered ? 'border-[var(--accent)] bg-[var(--info-bg)]/40 text-[var(--accent)]' : 'border-[var(--border)] bg-[var(--bg-hover)] text-[var(--text-muted)]'}`}>
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-semibold text-[var(--text-primary)]">{node.title}</h3>
                                                <p className="mt-1 text-sm text-[var(--text-muted)]">{node.description}</p>
                                                <p className="mt-2 text-xs font-medium uppercase tracking-[0.08em] text-[var(--text-muted)]">{node.footer}</p>
                                            </div>
                                        </div>
                                    </button>
                                    {index < flowNodes.length - 1 && <div className="flex justify-center py-2 text-[var(--border-highlight)]"><ArrowRight className="h-5 w-5" /></div>}
                                </div>
                            );
                        })}
                    </div>
                </SectionCard>

                <div className="space-y-6">
                    <SectionCard title="Triggered Campaign" description="Illustrative downstream campaign that fires from normalized events and automation rules.">
                        <Badge variant="warning">If Event = Cart Abandoned AND No Purchase in 24h</Badge>
                        <div className="mt-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-primary)] p-4">
                            <p className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Subject: You forgot something in your cart</p>
                            <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-card)] p-3">
                                <div className="mb-3 flex h-20 items-center justify-center rounded-[var(--radius)] bg-[var(--bg-hover)] text-[var(--text-muted)]">
                                    <Package className="h-6 w-6" />
                                </div>
                                <p className="text-sm font-medium text-[var(--text-primary)]">Product Name</p>
                                <p className="mt-1 text-sm text-[var(--text-muted)]">Complete your purchase before this item sells out.</p>
                                <Button fullWidth className="mt-4">Complete Purchase</Button>
                            </div>
                        </div>
                        <div className="mt-4 space-y-2 text-sm text-[var(--text-muted)]">
                            <p>Campaign name: <span className="font-medium text-[var(--text-primary)]">Abandoned Cart – Default</span></p>
                            <p>Status: <span className="font-medium text-[var(--success)]">Active</span></p>
                            <p>Emails sent today: <span className="font-medium text-[var(--text-primary)]">342</span></p>
                        </div>
                        <div className="mt-4 flex flex-col gap-2">
                            <Button>View Campaign</Button>
                            <Button variant="outline">Edit Rules</Button>
                        </div>
                    </SectionCard>

                    <InlineAlert
                        variant="success"
                        title="System Status"
                        description="Events processed today: 12,482. Queue backlog: 0. Email failures: 0."
                    />
                </div>
            </div>
        </div>
    );
}
