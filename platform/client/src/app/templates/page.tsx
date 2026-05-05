"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Plus, Search, ChevronDown, Clock, FileText, Image as ImageIcon, LayoutTemplate, MoreVertical, Trash2, Edit2, ExternalLink } from "lucide-react";
import { 
    PageHeader, StatCard, DataTable, Button, Badge, 
    EmptyState, Breadcrumb, Card, useToast, ConfirmModal 
} from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { can } from "@/utils/permissions";
import { TEMPLATE_PRESETS } from "./[id]/block/templates_library";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

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
    design_json?: any;
}

const TemplatePreview = ({ html, name, theme }: { html: string, name: string, theme?: any }) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.26);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;
        const updateScale = () => {
            const width = containerRef.current?.offsetWidth || 160;
            setScale(width / 600);
        };
        updateScale();
        const observer = new ResizeObserver(updateScale);
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={containerRef} className="h-full w-full relative overflow-hidden flex justify-center transition-all duration-700" style={{ background: theme?.background || "#fff", opacity: loaded ? 1 : 0.6 }}>
            {html ? (
                <div style={{
                    width: "600px",
                    height: `${containerRef.current?.offsetHeight ? containerRef.current.offsetHeight / scale : 800}px`, 
                    transform: `scale(${scale})`,
                    transformOrigin: "top center",
                    pointerEvents: "none",
                    position: "absolute",
                    top: 0,
                }}>
                    <iframe 
                        srcDoc={html} 
                        onLoad={() => setLoaded(true)}
                        title={`Preview ${name}`}
                        style={{ width: "100%", height: "100%", border: "none" }}
                    />
                </div>
            ) : (
                <div className="h-full w-full bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-muted)]">
                    <FileText size={48} strokeWidth={1} className="opacity-10" />
                </div>
            )}
        </div>
    );
};

export default function TemplatesPage() {
    const { token, user, isLoading: authLoading } = useAuth();
    const { success, error, warning } = useToast();
    const router = useRouter();

    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    
    // Gallery State
    const [galleryExpanded, setGalleryExpanded] = useState(false);
    const [activeCategory, setActiveCategory] = useState("All");

    const [creatingPreset, setCreatingPreset] = useState<string | null>(null);
    const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);

    useEffect(() => {
        if (!authLoading) {
            if (user && !can(user, "template:view")) {
                router.replace("/dashboard");
            } else if (token) {
                fetchTemplates();
            }
        }
    }, [authLoading, token, user]);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/templates?page=1&limit=50`, {
                headers: apiHeaders(token!),
            });
            if (res.ok) {
                const data = await res.json();
                setTemplates(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch templates", err);
        } finally {
            setLoading(false);
        }
    };

    const getPresetCategory = (preset: any) => {
        if (preset.category) return preset.category;
        const name = preset.name.toLowerCase();
        if (name.includes("stock") || name.includes("arrival") || name.includes("sale") || name.includes("deal") || name.includes("offer") || name.includes("ecommerce")) {
            return "Ecommerce";
        } else if (name.includes("newsletter") || name.includes("announcement") || name.includes("marketing") || name.includes("digest") || name.includes("event") || name.includes("promo")) {
            return "Marketing";
        } else if (name.includes("welcome") || name.includes("onboarding") || name.includes("feature") || name.includes("verified")) {
            return "Onboarding";
        } else if (name.includes("reset") || name.includes("billing") || name.includes("invoice") || name.includes("transactional")) {
            return "Transactional";
        }
        return "General";
    };

    const handleCreateTemplate = async (presetId?: string) => {
        if (creatingPreset) return;
        setCreatingPreset(presetId || "blank");
        
        const preset = presetId && presetId !== "blank" 
            ? TEMPLATE_PRESETS.find(p => p.id === presetId) 
            : null;

        const name = preset ? preset.name : "Untitled Email";
        
        try {
            const res = await fetch(`${API_BASE}/templates`, {
                method: "POST",
                headers: apiHeaders(token!),
                body: JSON.stringify({
                    name: name,
                    subject: `${name} - Subject`,
                    category: preset ? getPresetCategory(preset) : "General",
                    design_json: preset ? (preset.design || {}) : { theme: { background: "#f3f4f6", contentWidth: 600, fontFamily: "Arial, sans-serif", primaryColor: "#4f46e5" }, rows: [] },
                    compiled_html: null,
                    template_type: "block",
                    schema_version: "2.0.0",
                }),
            });

            if (res.ok) {
                const data = await res.json();
                router.push(`/templates/${data.id}/block`);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setCreatingPreset(null);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`${API_BASE}/templates/${id}`, {
                method: "DELETE",
                headers: apiHeaders(token!),
            });
            if (res.ok) {
                setTemplates(prev => prev.filter(t => t.id !== id));
                success("Template deleted successfully");
            } else {
                error("Failed to delete template");
            }
        } catch (err) {
            error("Error deleting template");
        } finally {
            setTemplateToDelete(null);
        }
    };

    const galleryCategories = ["All", ...Array.from(new Set(TEMPLATE_PRESETS.map(p => getPresetCategory(p))))];
    
    const filteredGallery = useMemo(() => {
        if (activeCategory === "All") return TEMPLATE_PRESETS;
        return TEMPLATE_PRESETS.filter(p => getPresetCategory(p) === activeCategory);
    }, [activeCategory]);

    const topPresets = TEMPLATE_PRESETS.slice(0, 8);

    const columns = [
        {
            key: "name",
            header: "Template Name",
            sortable: true,
            render: (t: Template) => (
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                        <FileText size={16} />
                    </div>
                    <div>
                        <div className="font-semibold text-slate-900">{t.name}</div>
                        <div className="text-[11px] text-slate-500">{t.category || "General"}</div>
                    </div>
                </div>
            )
        },
        {
            key: "subject",
            header: "Email Subject",
            sortable: true,
            render: (t: Template) => (
                <span className="text-[13px] text-slate-600 line-clamp-1">{t.subject || "No subject set"}</span>
            )
        },
        {
            key: "updated_at",
            header: "Last Modified",
            sortable: true,
            render: (t: Template) => (
                <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
                    <Clock size={12} />
                    {new Date(t.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </div>
            )
        },
        {
            key: "actions",
            header: "",
            render: (t: Template) => (
                <div className="flex items-center justify-end gap-2">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => router.push(`/templates/${t.id}/block`)}
                    >
                        <Edit2 size={14} className="text-slate-500" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                        onClick={() => setTemplateToDelete(t)}
                    >
                        <Trash2 size={14} />
                    </Button>
                </div>
            )
        }
    ];

    if (authLoading || (user && !can(user, "template:view"))) return null;

    // Filter templates based on search
    const filteredTemplates = templates.filter(t => 
        t.name.toLowerCase().includes(search.toLowerCase()) || 
        t.subject.toLowerCase().includes(search.toLowerCase())
    );

    // Group presets by category for the expanded gallery
    const categorizedPresets = useMemo(() => {
        return TEMPLATE_PRESETS.reduce((acc, preset) => {
            const cat = getPresetCategory(preset);
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(preset);
            return acc;
        }, {} as Record<string, typeof TEMPLATE_PRESETS>);
    }, []);

    const formatRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        
        if (diffInSeconds < 60) return "Just now";
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    return (
        <div className="min-h-screen space-y-8 pb-24">
            {/* --- HEADER --- */}
            <Breadcrumb items={[{ label: "ShrFlow", href: "/dashboard" }, { label: "Templates" }]} />
            
            <PageHeader 
                title="Templates" 
                subtitle="Create, design, and manage your reusable email content library."
                action={
                    <div className="flex gap-3">
                        <Button onClick={() => handleCreateTemplate("blank")}>
                            <Plus size={16} /> New template
                        </Button>
                    </div>
                }
            />

            {/* --- START A NEW EMAIL (Primary Section) --- */}
            <div className="animate-slide-up">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest">Start a new email</h2>
                    <button 
                        onClick={() => setGalleryExpanded(!galleryExpanded)}
                        className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    >
                        Template gallery <ChevronDown size={14} className={`transition-transform duration-300 ${galleryExpanded ? "rotate-180" : ""}`} />
                    </button>
                </div>

                <div className="flex gap-5 overflow-x-auto pb-6 pt-2 no-scrollbar -mx-1 px-1">


                    {/* Top Presets */}
                    {topPresets.map(preset => (
                        <div 
                            key={preset.id}
                            onClick={() => handleCreateTemplate(preset.id)}
                            className="group w-[160px] shrink-0 cursor-pointer"
                        >
                            <div className="aspect-[3/4] rounded-xl bg-[var(--bg-card)] border border-[var(--border)] shadow-sm overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:border-[var(--accent-border)]">
                                <div className="h-full w-full relative">
                                    {preset.thumbnail ? (
                                        <img src={preset.thumbnail} alt={preset.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-muted)]">
                                            <ImageIcon size={32} strokeWidth={1.5} />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">{getPresetCategory(preset)}</span>
                                    </div>
                                </div>
                            </div>
                            <p className="mt-3 text-[13px] font-medium text-[var(--text-primary)] text-center truncate px-2 group-hover:text-[var(--accent)] transition-colors">{preset.name}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- EXPANDABLE GALLERY --- */}
            <div 
                className={`overflow-hidden transition-all duration-500 ease-in-out ${galleryExpanded ? "max-h-[3000px] opacity-100 mb-8" : "max-h-0 opacity-0 mb-0"}`}
            >
                <div className="p-8 pb-16 rounded-[var(--radius-xl)] bg-[var(--bg-card)] border border-[var(--accent-border)] shadow-sm">
                    {Object.entries(categorizedPresets).map(([category, items]) => (
                        <div key={category} className="mb-10 last:mb-0">
                            <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-6 border-b border-[var(--border)] pb-2">{category}</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-10 pb-12 px-1">
                                {items.map(preset => (
                                    <div 
                                        key={preset.id}
                                        onClick={() => handleCreateTemplate(preset.id)}
                                        className="group cursor-pointer"
                                    >
                                        <div className="aspect-[3/4] rounded-xl bg-[var(--bg-card)] border border-[var(--border)] shadow-sm overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:border-[var(--accent-border)]">
                                            <div className="h-full w-full relative">
                                                {preset.thumbnail ? (
                                                    <img src={preset.thumbnail} alt={preset.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="h-full w-full bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-muted)]">
                                                        <ImageIcon size={32} strokeWidth={1.5} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <p className="mt-3 text-[13px] font-medium text-[var(--text-primary)] text-center truncate px-2 group-hover:text-[var(--accent)] transition-colors">{preset.name}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- RECENT EMAILS --- */}
            <div className="stagger-2 animate-slide-up mt-20">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <h2 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest">Recent emails</h2>
                    
                    <div className="relative max-w-md w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                        <input 
                            type="text"
                            placeholder="Search emails..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-sm rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] transition-all shadow-sm"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="animate-pulse">
                                <div className="aspect-[3/4] rounded-[var(--radius-lg)] bg-[var(--bg-secondary)] mb-3" />
                                <div className="h-4 bg-[var(--bg-secondary)] rounded w-3/4 mb-2" />
                                <div className="h-3 bg-[var(--bg-secondary)] rounded w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : filteredTemplates.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {filteredTemplates.map(t => (
                            <div 
                                key={t.id}
                                onClick={() => router.push(`/templates/${t.id}/block`)}
                                className="group cursor-pointer"
                            >
                                <div className="aspect-[3/4] rounded-xl bg-[var(--bg-card)] border border-[var(--border)] shadow-sm overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:border-[var(--accent-border)] relative">
                                    <div className="h-full w-full relative overflow-hidden">
                                        <TemplatePreview html={t.compiled_html} name={t.name} theme={t.design_json?.theme} />
                                        
                                        {/* Subtle pattern background for empty thumbnails removed as TemplatePreview handles it */}
                                    </div>
                                    
                                    {/* Action Overlay */}
                                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0">
                                        <button 
                                            className="h-8 w-8 rounded-full shadow-lg bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center text-rose-500 hover:bg-rose-50 hover:border-rose-100 transition-all"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setTemplateToDelete(t);
                                            }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-4 text-center px-2">
                                    <h3 className="text-[13px] font-semibold text-[var(--text-primary)] truncate group-hover:text-[var(--accent)] transition-colors">{t.name}</h3>
                                    <p className="text-[10px] text-[var(--text-muted)] mt-1 font-medium">Edited {formatRelativeTime(t.updated_at)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-20 flex flex-col items-center justify-center bg-[var(--bg-card)] rounded-[var(--radius-xl)] border border-dashed border-[var(--border)]">
                        <div className="h-20 w-20 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-muted)] mb-6">
                            <LayoutTemplate size={40} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">No emails yet</h3>
                        <p className="text-sm text-[var(--text-muted)] mb-8 text-center max-w-xs">
                            Start from blank or choose a template from the gallery to create your first design.
                        </p>
                        <Button 
                            onClick={() => handleCreateTemplate("blank")} 
                            className="px-8"
                        >
                            <Plus size={18} className="mr-2" /> Create your first email
                        </Button>
                    </div>
                )}
            </div>

            {/* Confirm Delete Modal */}
            <ConfirmModal 
                isOpen={!!templateToDelete}
                onClose={() => setTemplateToDelete(null)}
                onConfirm={() => templateToDelete && handleDelete(templateToDelete.id)}
                title="Delete Template"
                message={`Are you sure you want to delete "${templateToDelete?.name}"? This action cannot be undone.`}
                confirmLabel="Delete Template"
                variant="danger"
            />
        </div>
    );
}
