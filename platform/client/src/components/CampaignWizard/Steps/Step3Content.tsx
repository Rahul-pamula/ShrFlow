"use client";

import { useState, useEffect, useRef } from "react";
import { LayoutTemplate, PenLine, Check, Search, Loader2, X, Paperclip, Upload } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button, FilterBar, Input, SectionCard } from "@/components/ui";

type ContentMode = "compose" | "template";

const MODES = [
    {
        id: "compose" as ContentMode,
        icon: PenLine,
        label: "Compose Email",
        description: "Write text and add attachments, like a direct outbound message.",
    },
    {
        id: "template" as ContentMode,
        icon: LayoutTemplate,
        label: "Use a Template",
        description: "Pick a saved design from your template library.",
    },
];

export default function Step3Content({ data, updateData, onNext, onBack }: any) {
    const { token } = useAuth();
    const [mode, setMode] = useState<ContentMode>(data.contentMode || "compose");
    const [templates, setTemplates] = useState<any[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [search, setSearch] = useState("");
    const [bodyText, setBodyText] = useState(data.bodyText || "");
    const [attachments, setAttachments] = useState<File[]>(data.attachments || []);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (mode !== "template" || !token) return;
        setLoadingTemplates(true);
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        fetch(`${API_BASE}/templates/`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => (r.ok ? r.json() : { data: [] }))
            .then((json) => setTemplates(Array.isArray(json.data) ? json.data : []))
            .catch(() => setTemplates([]))
            .finally(() => setLoadingTemplates(false));
    }, [mode, token]);

    const handleModeChange = (nextMode: ContentMode) => {
        setMode(nextMode);
        updateData({ contentMode: nextMode, templateId: "", templateName: "", htmlContent: "", bodyText: "" });
        setBodyText("");
    };

    const handleBodyChange = (val: string) => {
        setBodyText(val);
        const html = `<div style="font-family:sans-serif;font-size:14px;line-height:1.6;color:#111;">${val.replace(/\n/g, "<br/>")}</div>`;
        updateData({
            bodyText: val,
            htmlContent: html,
            contentMode: "compose",
            templateName: "Composed Email",
            attachments,
        });
    };

    const handleTemplateSelect = (template: any) => {
        updateData({
            templateId: template.id,
            templateName: template.name,
            htmlContent: template.compiled_html,
            contentMode: "template",
        });
    };

    const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const updated = [...attachments, ...files].slice(0, 5);
        setAttachments(updated);
        updateData({ attachments: updated });
    };

    const removeFile = (idx: number) => {
        const updated = attachments.filter((_, i) => i !== idx);
        setAttachments(updated);
        updateData({ attachments: updated });
    };

    const canProceed = () => {
        if (mode === "compose") return bodyText.trim().length > 10;
        if (mode === "template") return !!data.templateId;
        return false;
    };

    const filtered = templates.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="p-9">
            <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius)] border border-[var(--accent)] bg-[var(--accent-glow)]">
                    <PenLine className="h-[18px] w-[18px] text-[var(--accent)]" />
                </div>
                <div>
                    <h2 className="m-0 text-lg font-semibold text-[var(--text-primary)]">Email Content</h2>
                    <p className="mt-0.5 text-sm text-[var(--text-secondary)]">Choose how you want to create this campaign’s message.</p>
                </div>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-3">
                {MODES.map((m) => {
                    const Icon = m.icon;
                    const isActive = mode === m.id;
                    return (
                        <button
                            key={m.id}
                            type="button"
                            onClick={() => handleModeChange(m.id)}
                            className={`rounded-[var(--radius-lg)] border p-4 text-left transition ${
                                isActive
                                    ? "border-[var(--accent-border)] bg-[var(--accent)]/10"
                                    : "border-[var(--border)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)]"
                            }`}
                        >
                            <div className="mb-1 flex items-center gap-2">
                                <Icon className={`h-4 w-4 ${isActive ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}`} />
                                <span className={`text-sm font-semibold ${isActive ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}>{m.label}</span>
                                {isActive && (
                                    <span className="ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent)] text-white">
                                        <Check className="h-2.5 w-2.5" />
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-[var(--text-secondary)]">{m.description}</p>
                        </button>
                    );
                })}
            </div>

            {mode === "compose" && (
                <div className="flex flex-col gap-4">
                    <SectionCard title="Compose Message" description="Write the email body directly and optionally attach supporting files.">
                        <div>
                            <label className="mb-2 block text-xs font-medium text-[var(--text-muted)]">Email Body</label>
                            <textarea
                                placeholder={"Hi {{first_name}},\n\nWrite your message here...\n\nBest regards,\nYour Team"}
                                value={bodyText}
                                onChange={(e) => handleBodyChange(e.target.value)}
                                className="min-h-[180px] w-full resize-y rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-input)] p-3.5 text-sm leading-relaxed text-[var(--text-primary)] outline-none transition-all focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                            />
                            <p className="mt-1.5 text-xs text-[var(--text-secondary)]">
                                Use <code className="rounded-[var(--radius-sm)] bg-[var(--accent)]/10 px-1.5 py-0.5 text-[var(--accent)]">{"{{first_name}}"}</code>{" "}
                                and{" "}
                                <code className="rounded-[var(--radius-sm)] bg-[var(--accent)]/10 px-1.5 py-0.5 text-[var(--accent)]">{"{{last_name}}"}</code> for personalization.
                            </p>
                        </div>
                    </SectionCard>

                    <SectionCard title="Attachments" description="Optional files, up to 5 per campaign.">
                        <div
                            onClick={() => fileRef.current?.click()}
                            className="cursor-pointer rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] bg-[var(--bg-input)]/50 p-5 text-center transition-all hover:border-[var(--accent-border)] hover:bg-[var(--bg-hover)]"
                        >
                            <Upload className="mx-auto mb-2 h-4 w-4 text-[var(--text-secondary)]" />
                            <p className="text-xs text-[var(--text-secondary)]">Click to attach files — PDF, PNG, JPG, DOCX</p>
                            <input
                                ref={fileRef}
                                type="file"
                                multiple
                                accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx,.csv"
                                onChange={handleFilePick}
                                className="hidden"
                            />
                        </div>

                        {attachments.length > 0 && (
                            <div className="mt-3 flex flex-col gap-1.5">
                                {attachments.map((file, idx) => (
                                    <div key={idx} className="flex items-center justify-between rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2">
                                        <div className="flex items-center gap-2">
                                            <Paperclip className="h-3.5 w-3.5 text-[var(--accent)]" />
                                            <span className="text-xs text-[var(--text-primary)]">{file.name}</span>
                                            <span className="text-[11px] text-[var(--text-secondary)]">({(file.size / 1024).toFixed(0)} KB)</span>
                                        </div>
                                        <button type="button" onClick={() => removeFile(idx)} className="p-0.5 text-[var(--text-secondary)] transition-colors hover:text-[var(--danger)]">
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </SectionCard>
                </div>
            )}

            {mode === "template" && (
                <SectionCard title="Template Library" description="Search your saved templates and pick one to continue.">
                    <FilterBar className="mb-4">
                        <div className="relative w-full max-w-sm">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                            <input
                                type="text"
                                placeholder="Search templates..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-10 w-full rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-input)] py-2.5 pl-9 pr-4 text-sm text-[var(--text-primary)] outline-none transition-all focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                            />
                        </div>
                    </FilterBar>

                    {loadingTemplates ? (
                        <div className="flex justify-center p-10">
                            <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] p-8 text-center">
                            <LayoutTemplate className="mx-auto mb-3 h-8 w-8 text-[var(--text-muted)]" />
                            <p className="mb-1 text-sm text-[var(--text-secondary)]">No templates found.</p>
                            <p className="text-xs text-[var(--text-muted)]">Build one in <strong className="text-[var(--text-primary)]">Templates → Editor</strong>, or switch to Compose mode.</p>
                        </div>
                    ) : (
                        <div className="grid max-h-[260px] grid-cols-3 gap-3 overflow-y-auto pr-1">
                            {filtered.map((t) => {
                                const isSelected = data.templateId === t.id;
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => handleTemplateSelect(t)}
                                        className={`relative overflow-hidden rounded-[var(--radius-lg)] border text-left transition-all ${
                                            isSelected
                                                ? "border-[var(--accent-border)] bg-[var(--accent)]/10"
                                                : "border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--text-muted)]"
                                        }`}
                                    >
                                        <div className="flex aspect-[16/9] items-center justify-center bg-black/40">
                                            <LayoutTemplate className="h-5 w-5 text-[var(--text-muted)]" />
                                            {isSelected && (
                                                <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-white">
                                                    <Check className="h-2.5 w-2.5" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-2.5">
                                            <p className="truncate text-xs font-semibold text-[var(--text-primary)]">{t.name}</p>
                                            <p className="mt-0.5 text-[10px] text-[var(--text-secondary)]">{new Date(t.updated_at).toLocaleDateString()}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </SectionCard>
            )}

            <div className="mt-8 flex justify-between border-t border-[var(--border)] pt-6">
                <Button variant="ghost" onClick={onBack}>
                    ← Back
                </Button>
                <Button onClick={onNext} disabled={!canProceed()}>
                    Next Step →
                </Button>
            </div>
        </div>
    );
}
