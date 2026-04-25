"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Plus, Search, Trash2, Copy, FileText, ChevronRight, Sparkles, LayoutTemplate } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { TEMPLATE_PRESETS } from "./templatePresets";
import { Button, ConfirmModal, FilterBar, EmptyState, PageHeader, SectionCard, StatCard, useToast } from "@/components/ui";

const API_BASE = "http://127.0.0.1:8000";

function apiHeaders(token: string) {
    return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

interface Template {
    id: string;
    name: string;
    subject: string;
    category: string;
    updated_at: string;
    compiled_html: string;
    design_json?: { editor?: string; [key: string]: any };
}

export default function TemplatesPage() {
    const { token, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const { success, error } = useToast();

    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [creatingPreset, setCreatingPreset] = useState<string | null>(null);
    const [showAllPresets, setShowAllPresets] = useState(false);
    const [pendingAction, setPendingAction] = useState<{ type: "duplicate" | "delete"; id: string } | null>(null);

    useEffect(() => {
        if (!authLoading && token) {
            fetchTemplates();
        }
    }, [authLoading, token, page]);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/templates?page=${page}&limit=12`, {
                headers: apiHeaders(token!),
            });
            if (res.ok) {
                const data = await res.json();
                setTemplates(data.data);
                setTotal(data.total);
            }
        } catch (err) {
            console.error("Failed to fetch templates", err);
        } finally {
            setLoading(false);
        }
    };

    const handleUsePreset = async (presetId: string) => {
        const preset = TEMPLATE_PRESETS.find((entry) => entry.id === presetId);
        if (!preset) return;

        if (presetId === "blank") {
            router.push("/templates/new");
            return;
        }

        setCreatingPreset(presetId);
        try {
            const res = await fetch(`${API_BASE}/templates`, {
                method: "POST",
                headers: apiHeaders(token!),
                body: JSON.stringify({
                    name: preset.name,
                    subject: `${preset.name} - Edit subject`,
                    category: preset.category,
                    design_json: preset.design || {},
                    compiled_html: "<p>Loading…</p>",
                    template_type: "block",
                    schema_version: "2.0.0",
                }),
            });

            if (res.ok) {
                const data = await res.json();
                router.push(`/templates/${data.id}/builder`);
            } else {
                error("Failed to create template from preset");
            }
        } catch (err) {
            console.error(err);
            error("Error creating template");
        } finally {
            setCreatingPreset(null);
        }
    };

    const handleEdit = (id: string) => {
        router.push(`/templates/${id}/builder`);
    };

    const handleDuplicate = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setPendingAction({ type: "duplicate", id });
    };

    const confirmDuplicate = async (id: string) => {
        try {
            const res = await fetch(`${API_BASE}/templates/${id}/duplicate`, {
                method: "POST",
                headers: apiHeaders(token!),
            });
            if (res.ok) {
                success("Template duplicated");
                fetchTemplates();
            } else {
                error("Failed to duplicate template");
            }
        } catch {
            error("Failed to duplicate template");
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setPendingAction({ type: "delete", id });
    };

    const confirmDelete = async (id: string) => {
        try {
            const res = await fetch(`${API_BASE}/templates/${id}`, {
                method: "DELETE",
                headers: apiHeaders(token!),
            });
            if (res.ok) {
                success("Template deleted");
                fetchTemplates();
            } else {
                error("Failed to delete template");
            }
        } catch {
            error("Failed to delete template");
        }
    };

    const filtered = useMemo(() => (
        templates.filter((template) =>
            template.name.toLowerCase().includes(search.toLowerCase()) ||
            template.subject.toLowerCase().includes(search.toLowerCase()),
        )
    ), [templates, search]);

    const visiblePresets = showAllPresets ? TEMPLATE_PRESETS : TEMPLATE_PRESETS.slice(0, 6);

    const summaryMetrics = [
        { label: "Templates", value: total.toLocaleString() },
        { label: "Presets", value: TEMPLATE_PRESETS.length.toString() },
        { label: "Visible Results", value: filtered.length.toString() },
        { label: "Current Page", value: page.toString() },
    ];

    if (authLoading) {
        return <div className="px-8 py-10 text-sm text-[var(--text-muted)]">Loading templates…</div>;
    }

    return (
        <div className="space-y-8 pb-8">
            <PageHeader
                title="Templates"
                subtitle="Create reusable email layouts, start from proven presets, and keep your sending system visually consistent."
                action={
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setShowAllPresets((current) => !current)}>
                            <Sparkles className="h-4 w-4" />
                            {showAllPresets ? "Show Fewer Presets" : "Browse Presets"}
                        </Button>
                        <Button onClick={() => router.push("/templates/new")}>
                            <Plus className="h-4 w-4" />
                            New Template
                        </Button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {summaryMetrics.map((metric) => (
                    <StatCard key={metric.label} label={metric.label} value={metric.value} />
                ))}
            </div>

            <SectionCard
                title="Start from a proven structure"
                description="Use these as launch points for onboarding, marketing, ecommerce, and lifecycle messaging."
                action={TEMPLATE_PRESETS.length > 6 ? (
                    <Button variant="ghost" onClick={() => setShowAllPresets((current) => !current)}>
                        {showAllPresets ? "Show Less" : "Template Gallery"}
                        <ChevronRight className={`h-4 w-4 transition ${showAllPresets ? "rotate-90" : ""}`} />
                    </Button>
                ) : undefined}
            >
                <div className="mb-5 flex items-center gap-2">
                    <LayoutTemplate className="h-4 w-4 text-[var(--accent)]" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Template Gallery</span>
                </div>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
                    {visiblePresets.map((preset) => (
                        <button
                            key={preset.id}
                            onClick={() => handleUsePreset(preset.id)}
                            disabled={creatingPreset === preset.id}
                            className="group text-left disabled:cursor-wait disabled:opacity-60"
                        >
                            <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-primary)] transition group-hover:border-[var(--accent-border)] group-hover:bg-[var(--bg-hover)]">
                                <div className="relative aspect-[3/4] overflow-hidden border-b border-[var(--border)] bg-[var(--bg-hover)]">
                                    {preset.thumbnail ? (
                                        <img
                                            src={preset.thumbnail}
                                            alt={preset.name}
                                            className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-[var(--text-muted)]">
                                            <Plus className="h-7 w-7" strokeWidth={1.5} />
                                            <span className="text-xs font-medium">Blank Canvas</span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-3">
                                    <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{preset.name}</p>
                                    <p className="mt-1 truncate text-xs capitalize text-[var(--text-muted)]">{preset.category}</p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </SectionCard>

            <SectionCard
                title="Saved Templates"
                description="Recent templates across the workspace. Search by name or subject and jump directly into the builder."
            >
                {total > 0 && (
                    <FilterBar className="mb-5">
                        <div className="relative w-full max-w-sm">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                            <input
                                type="text"
                                placeholder="Search templates..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-input)] pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)]"
                            />
                        </div>
                    </FilterBar>
                )}

                {loading ? (
                    <div className="py-16 text-center text-sm text-[var(--text-muted)]">Loading templates...</div>
                ) : filtered.length === 0 ? (
                    <EmptyState
                        icon={<FileText className="h-10 w-10" />}
                        title={total === 0 ? "No templates yet" : "No matching templates"}
                        description={total === 0 ? "Choose a preset above or start from scratch to create your first reusable template." : "Try adjusting your search or create a new template."}
                        action={<Button onClick={() => router.push("/templates/new")}>Create Template</Button>}
                    />
                ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {filtered.map((template) => {
                            const hasRealHtml = template.compiled_html && template.compiled_html.length > 50;

                            return (
                                <div
                                    key={template.id}
                                    onClick={() => handleEdit(template.id)}
                                    className="group cursor-pointer overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-primary)] transition hover:border-[var(--accent-border)] hover:bg-[var(--bg-hover)]"
                                >
                                    <div className="relative h-40 overflow-hidden border-b border-[var(--border)] bg-[var(--bg-hover)]">
                                        {hasRealHtml ? (
                                            <iframe
                                                srcDoc={template.compiled_html}
                                                title={template.name}
                                                className="h-[200%] w-[200%] origin-top-left scale-50 border-0 pointer-events-none"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-[var(--text-muted)]">
                                                <FileText className="h-7 w-7" strokeWidth={1.5} />
                                                <span className="text-xs">No preview</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-4">
                                        <div className="mb-2 flex items-start justify-between gap-3">
                                            <h3 className="truncate text-sm font-semibold text-[var(--text-primary)]">{template.name}</h3>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={(e) => handleDuplicate(e, template.id)}
                                                    className="rounded-[var(--radius)] p-1 text-[var(--text-muted)] transition hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]"
                                                    title="Duplicate"
                                                >
                                                    <Copy className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDelete(e, template.id)}
                                                    className="rounded-[var(--radius)] p-1 text-[var(--danger)] transition hover:bg-[var(--danger-bg)]"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        <p className="truncate text-sm text-[var(--text-muted)]">{template.subject}</p>

                                        <div className="mt-4 flex items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
                                            <span>{new Date(template.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                                            <span className="rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-2 py-1 capitalize text-[var(--text-secondary)]">
                                                {template.category}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </SectionCard>

            <ConfirmModal
                isOpen={!!pendingAction}
                onClose={() => setPendingAction(null)}
                onConfirm={() => {
                    if (!pendingAction) return;
                    const current = pendingAction;
                    setPendingAction(null);
                    if (current.type === "duplicate") {
                        void confirmDuplicate(current.id);
                    } else {
                        void confirmDelete(current.id);
                    }
                }}
                title={pendingAction?.type === "duplicate" ? "Duplicate Template?" : "Delete Template?"}
                message={pendingAction?.type === "duplicate" ? "Create a copy of this template so you can adapt it without changing the original." : "This template will be permanently removed from the workspace."}
                confirmLabel={pendingAction?.type === "duplicate" ? "Duplicate" : "Delete"}
                variant={pendingAction?.type === "duplicate" ? "primary" : "danger"}
            />
        </div>
    );
}
