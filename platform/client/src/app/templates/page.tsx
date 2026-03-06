"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Trash2, Copy, FileText, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { TEMPLATE_PRESETS } from "./templatePresets";

// ===== API Helper =====
const API_BASE = "http://127.0.0.1:8000";

function apiHeaders(token: string) {
    return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

// ===== Types =====
interface Template {
    id: string;
    name: string;
    subject: string;
    category: string;
    updated_at: string;
    compiled_html: string;
    mjml_json?: { editor?: string;[key: string]: any };
}

export default function TemplatesPage() {
    const { token, isLoading: authLoading } = useAuth();
    const router = useRouter();

    // State
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [creatingPreset, setCreatingPreset] = useState<string | null>(null);
    const [showAllPresets, setShowAllPresets] = useState(false);

    // Initial Fetch
    useEffect(() => {
        if (!authLoading && token) {
            fetchTemplates();
        }
    }, [authLoading, token, page]);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/templates?page=${page}&limit=12`, {
                headers: apiHeaders(token!)
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

    // Use a preset: create it in the DB and redirect to editor
    const handleUsePreset = async (presetId: string) => {
        const preset = TEMPLATE_PRESETS.find(p => p.id === presetId);
        if (!preset) return;

        // Blank canvas goes to /templates/new
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
                    schema_version: "2.0.0"
                })
            });

            if (res.ok) {
                const data = await res.json();
                router.push(`/templates/${data.id}/block`);
            } else {
                alert("Failed to create template from preset");
            }
        } catch (err) {
            console.error(err);
            alert("Error creating template");
        } finally {
            setCreatingPreset(null);
        }
    };

    const handleEdit = (id: string, editorType?: string) => {
        router.push(`/templates/${id}/block`);
    };

    const handleDuplicate = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm("Duplicate this template?")) return;
        try {
            const res = await fetch(`${API_BASE}/templates/${id}/duplicate`, {
                method: "POST",
                headers: apiHeaders(token!)
            });
            if (res.ok) fetchTemplates();
        } catch (err) {
            alert("Failed to duplicate template");
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this template?")) return;
        try {
            const res = await fetch(`${API_BASE}/templates/${id}`, {
                method: "DELETE",
                headers: apiHeaders(token!)
            });
            if (res.ok) fetchTemplates();
        } catch (err) {
            alert("Failed to delete template");
        }
    };

    if (authLoading) return <div style={{ padding: "40px" }}>Loading auth...</div>;

    const filtered = templates.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.subject.toLowerCase().includes(search.toLowerCase())
    );

    // Show first row (6 presets) or all
    const visiblePresets = showAllPresets ? TEMPLATE_PRESETS : TEMPLATE_PRESETS.slice(0, 6);

    return (
        <div style={{ fontFamily: "Inter, sans-serif", color: "#E5E7EB", minHeight: "100vh", backgroundColor: "#0A0A0B" }}>

            {/* ====== TEMPLATE GALLERY ====== */}
            <div style={{ backgroundColor: "#111113", padding: "40px 0 32px", borderBottom: "1px solid #1F2937" }}>
                <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 48px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                        <h2 style={{ fontSize: "14px", fontWeight: 500, color: "#9CA3AF", margin: 0, letterSpacing: "0.2px" }}>
                            Start a new email from a template
                        </h2>
                        {TEMPLATE_PRESETS.length > 6 && (
                            <button
                                onClick={() => setShowAllPresets(!showAllPresets)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "#3B82F6",
                                    fontSize: "13px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    fontWeight: 500,
                                    padding: "4px 8px",
                                    borderRadius: "4px",
                                    transition: "background-color 0.2s"
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(59, 130, 246, 0.1)"}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                            >
                                {showAllPresets ? "Show less" : "Template gallery"}
                                <ChevronRight size={16} style={{ transform: showAllPresets ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
                            </button>
                        )}
                    </div>

                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))",
                        gap: "16px",
                    }}>
                        {visiblePresets.map(preset => (
                            <div
                                key={preset.id}
                                onClick={() => handleUsePreset(preset.id)}
                                style={{
                                    cursor: creatingPreset === preset.id ? "wait" : "pointer",
                                    opacity: creatingPreset === preset.id ? 0.6 : 1,
                                    transition: "opacity 0.2s"
                                }}
                            >
                                <div
                                    style={{
                                        width: "100%",
                                        aspectRatio: "3/4",
                                        borderRadius: "8px",
                                        border: "1px solid #374151",
                                        overflow: "hidden",
                                        backgroundColor: "#1F2937",
                                        transition: "all 0.15s cubic-bezier(0.4,0.0,0.2,1)",
                                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                                        position: "relative"
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = "#3B82F6";
                                        e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = "#374151";
                                        e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
                                    }}
                                >
                                    {/* Use PNG thumbnail if available, fallback to placeholder */}
                                    {preset.thumbnail ? (
                                        <img
                                            src={preset.thumbnail}
                                            alt={preset.name}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                                display: "block"
                                            }}
                                        />
                                    ) : (
                                        <div style={{
                                            width: "100%",
                                            height: "100%",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "8px",
                                            color: "#9CA3AF"
                                        }}>
                                            <Plus size={28} strokeWidth={1.5} />
                                            <span style={{ fontSize: "12px", fontWeight: 500 }}>Blank Canvas</span>
                                        </div>
                                    )}
                                </div>
                                <div style={{ marginTop: "12px" }}>
                                    <p style={{
                                        fontSize: "14px",
                                        fontWeight: 500,
                                        margin: "0 0 4px 0",
                                        color: "#F3F4F6",
                                        lineHeight: "20px",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap"
                                    }}>
                                        {preset.name}
                                    </p>
                                    <p style={{
                                        fontSize: "12px",
                                        color: "#9CA3AF",
                                        margin: 0,
                                        textTransform: "capitalize",
                                        fontWeight: 400
                                    }}>
                                        {preset.category}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ====== MY TEMPLATES ====== */}
            <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "40px 48px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                    <div>
                        <h1 style={{ fontSize: "18px", fontWeight: 500, marginBottom: "4px", color: "#F9FAFB" }}>Recent email templates</h1>
                        <p style={{ color: "#9CA3AF", fontSize: "14px", margin: 0, fontWeight: 400 }}>
                            Owned by anyone · {total} template{total !== 1 ? "s" : ""}
                        </p>
                    </div>
                </div>

                {/* Search */}
                {total > 0 && (
                    <div style={{ marginBottom: "24px", position: "relative", maxWidth: "420px" }}>
                        <Search style={{ position: "absolute", left: "14px", top: "12px", color: "#9CA3AF", width: "16px", height: "16px" }} />
                        <input
                            type="text"
                            placeholder="Search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                padding: "10px 14px 10px 40px",
                                width: "100%",
                                borderRadius: "8px",
                                border: "1px solid #374151",
                                fontSize: "14px",
                                outline: "none",
                                backgroundColor: "#111113",
                                color: "#F3F4F6",
                                transition: "background-color 0.2s, border-color 0.2s"
                            }}
                            onFocus={(e) => {
                                e.currentTarget.style.backgroundColor = "#1F2937";
                                e.currentTarget.style.borderColor = "#3B82F6";
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.backgroundColor = "#111113";
                                e.currentTarget.style.borderColor = "#374151";
                            }}
                        />
                    </div>
                )}

                {/* Template Grid */}
                {loading ? (
                    <div style={{ padding: "60px", textAlign: "center", color: "#9CA3AF", fontSize: "14px" }}>Loading templates...</div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "80px 24px", backgroundColor: "#111113", borderRadius: "12px", border: "1px dashed #374151" }}>
                        <FileText style={{ width: "48px", height: "48px", color: "#4B5563", marginBottom: "16px", strokeWidth: 1.5, marginLeft: "auto", marginRight: "auto" }} />
                        <h3 style={{ fontSize: "16px", fontWeight: 500, margin: "0 0 8px 0", color: "#F3F4F6" }}>No templates yet</h3>
                        <p style={{ color: "#9CA3AF", fontSize: "14px", margin: 0, maxWidth: "400px", marginLeft: "auto", marginRight: "auto" }}>
                            Choose a template above to get started, or create one from scratch.
                        </p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px" }}>
                        {filtered.map(template => {
                            // Check if compiled_html is real content (not just placeholder)
                            const hasRealHtml = template.compiled_html && template.compiled_html.length > 50;

                            return (
                                <div
                                    key={template.id}
                                    onClick={() => handleEdit(template.id, template.mjml_json?.editor)}
                                    style={{
                                        border: "1px solid #374151",
                                        borderRadius: "8px",
                                        overflow: "hidden",
                                        cursor: "pointer",
                                        transition: "all 0.15s cubic-bezier(0.4,0.0,0.2,1)",
                                        backgroundColor: "#1F2937",
                                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)";
                                        e.currentTarget.style.borderColor = "#3B82F6";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
                                        e.currentTarget.style.borderColor = "#374151";
                                    }}
                                >
                                    {/* Preview */}
                                    <div style={{ height: "140px", backgroundColor: "#111113", borderBottom: "1px solid #374151", position: "relative", overflow: "hidden" }}>
                                        {hasRealHtml ? (
                                            <iframe
                                                srcDoc={template.compiled_html}
                                                title={template.name}
                                                style={{ width: "200%", height: "200%", transform: "scale(0.5)", transformOrigin: "0 0", border: "none", pointerEvents: "none" }}
                                            />
                                        ) : (
                                            <div style={{
                                                width: "100%",
                                                height: "100%",
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: "6px",
                                                color: "#6B7280"
                                            }}>
                                                <FileText size={24} strokeWidth={1.5} />
                                                <span style={{ fontSize: "11px" }}>No preview</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div style={{ padding: "16px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                                            <h3 style={{
                                                fontSize: "15px",
                                                fontWeight: 500,
                                                margin: 0,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                maxWidth: "160px",
                                                color: "#F3F4F6"
                                            }}>
                                                {template.name}
                                            </h3>
                                            <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                                                <button
                                                    onClick={(e) => handleDuplicate(e, template.id)}
                                                    style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: "4px", borderRadius: "4px", display: "flex", transition: "background-color 0.2s" }}
                                                    title="Duplicate"
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#374151"}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                                >
                                                    <Copy size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDelete(e, template.id)}
                                                    style={{ background: "none", border: "none", cursor: "pointer", color: "#F87171", padding: "4px", borderRadius: "4px", display: "flex", transition: "background-color 0.2s" }}
                                                    title="Delete"
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(248, 113, 113, 0.1)"}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        <p style={{ fontSize: "13px", color: "#9CA3AF", margin: "0 0 12px 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {template.subject}
                                        </p>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "#9CA3AF" }}>
                                            <span>{new Date(template.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                            <span style={{ backgroundColor: "#374151", padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: 500, textTransform: "capitalize", color: "#E5E7EB" }}>
                                                {template.category}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
