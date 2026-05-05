"use client";
import React, { useState } from "react";
import {
    Type, Image as ImageIcon, Square, AlignLeft, AlignCenter, AlignRight,
    ChevronDown, Link, Trash2, Copy, Lock, Unlock, Settings, Palette,
    FileText, RotateCcw, ExternalLink
} from "lucide-react";
import { DesignBlock, DesignJSON, BlockType } from "./types";

// ─── SHARED PRIMITIVES ────────────────────────────────────────────────────────

const Row = ({ children, gap = 8 }: { children: React.ReactNode; gap?: number }) => (
    <div style={{ display: "flex", gap, alignItems: "center" }}>{children}</div>
);

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
        {children}
    </div>
);

const Group = ({ children, title }: { children: React.ReactNode; title?: string }) => (
    <div style={{ marginBottom: 20 }}>
        {title && <FieldLabel>{title}</FieldLabel>}
        {children}
    </div>
);

const Divider = () => <div style={{ height: 1, background: "#F1F5F9", margin: "16px 0" }} />;

const inp: React.CSSProperties = {
    width: "100%", padding: "8px 10px", border: "1px solid #E2E8F0", borderRadius: 8,
    fontSize: 13, background: "#fff", outline: "none", color: "#0F172A", boxSizing: "border-box",
};

const SmallInput = ({ value, onChange, type = "text", placeholder = "", min, max }: {
    value: any; onChange: (v: any) => void; type?: string; placeholder?: string; min?: number; max?: number;
}) => (
    <input
        type={type} value={value ?? ""} placeholder={placeholder}
        min={min} max={max}
        onChange={e => onChange(type === "number" ? Number(e.target.value) : e.target.value)}
        style={inp}
    />
);

const ColorRow = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <Group title={label}>
        <Row>
            <input type="color" value={value || "#000000"} onChange={e => onChange(e.target.value)}
                style={{ width: 36, height: 36, border: "1px solid #E2E8F0", borderRadius: 8, cursor: "pointer", padding: 2 }} />
            <input type="text" value={value || ""} onChange={e => onChange(e.target.value)}
                style={{ ...inp, flex: 1 }} />
        </Row>
    </Group>
);

const AlignRow = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <Group title="Alignment">
        <Row gap={4}>
            {(["left", "center", "right"] as const).map(a => (
                <button key={a} onClick={() => onChange(a)} style={{
                    flex: 1, padding: "7px 0", border: "1px solid #E2E8F0", borderRadius: 8, cursor: "pointer",
                    background: value === a ? "#6366F1" : "#fff", color: value === a ? "#fff" : "#64748B",
                    display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                    {a === "left" && <AlignLeft size={14} />}
                    {a === "center" && <AlignCenter size={14} />}
                    {a === "right" && <AlignRight size={14} />}
                </button>
            ))}
        </Row>
    </Group>
);

const PaddingGrid = ({ props, onUpdate }: { props: Record<string, any>; onUpdate: (k: string, v: any) => void }) => (
    <Group title="Padding (px)">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[["Top", "paddingTop"], ["Bottom", "paddingBottom"], ["Left", "paddingLeft"], ["Right", "paddingRight"]].map(([l, k]) => (
                <div key={k}>
                    <div style={{ fontSize: 10, color: "#94A3B8", marginBottom: 3 }}>{l}</div>
                    <SmallInput type="number" min={0} max={200} value={props[k] ?? 0} onChange={v => onUpdate(k, v)} />
                </div>
            ))}
        </div>
    </Group>
);

const EMAIL_FONTS = ["Arial", "Georgia", "Trebuchet MS", "Verdana", "Tahoma", "Times New Roman", "Courier New", "Impact"];

const FontRow = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <Group title="Font Family">
        <select value={value || "Arial"} onChange={e => onChange(e.target.value)} style={{ ...inp, cursor: "pointer" }}>
            {EMAIL_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
    </Group>
);

// ─── CONTENT TAB ──────────────────────────────────────────────────────────────

function ContentTab({ block, onUpdate, onOpenUpload }: {
    block: DesignBlock;
    onUpdate: (k: string, v: any) => void;
    onOpenUpload: () => void;
}) {
    const p = block.props;

    if (block.type === "text" || block.type === "floating-text") return (
        <>
            <Group title="Content">
                <textarea
                    value={p.content?.replace(/<[^>]*>/g, "") || ""}
                    onChange={e => onUpdate("content", `<p>${e.target.value}</p>`)}
                    rows={4}
                    style={{ ...inp, resize: "vertical", lineHeight: 1.6 }}
                />
                <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>HTML allowed — edit inline on canvas for rich formatting</div>
            </Group>
            <Group title="Link URL">
                <Row>
                    <Link size={14} style={{ color: "#94A3B8", flexShrink: 0 }} />
                    <SmallInput value={p.linkUrl || ""} onChange={v => onUpdate("linkUrl", v)} placeholder="https://example.com" />
                </Row>
            </Group>
        </>
    );

    if (block.type === "image" || block.type === "floating-image") return (
        <>
            <Group title="Image URL">
                <SmallInput value={p.src || ""} onChange={v => onUpdate("src", v)} placeholder="https://" />
            </Group>
            <Group>
                <button onClick={onOpenUpload} style={{
                    width: "100%", padding: "9px", border: "1px dashed #CBD5E1", borderRadius: 8,
                    background: "#F8FAFC", color: "#6366F1", fontSize: 13, fontWeight: 600,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                }}>
                    <ImageIcon size={14} /> Upload / Replace Image
                </button>
            </Group>
            <Group title="Alt Text (Accessibility)">
                <SmallInput value={p.alt || ""} onChange={v => onUpdate("alt", v)} placeholder="Describe this image" />
            </Group>
            <Group title="Link URL">
                <Row>
                    <Link size={14} style={{ color: "#94A3B8", flexShrink: 0 }} />
                    <SmallInput value={p.linkUrl || ""} onChange={v => onUpdate("linkUrl", v)} placeholder="https://example.com" />
                </Row>
            </Group>
        </>
    );

    if (block.type === "button") return (
        <>
            <Group title="Button Text">
                <SmallInput value={p.text || ""} onChange={v => onUpdate("text", v)} placeholder="Click Here" />
            </Group>
            <Group title="Button URL">
                <Row>
                    <ExternalLink size={14} style={{ color: "#94A3B8", flexShrink: 0 }} />
                    <SmallInput value={p.url || ""} onChange={v => onUpdate("url", v)} placeholder="https://example.com" />
                </Row>
            </Group>
        </>
    );

    if (block.type === "hero") return (
        <>
            <Group title="Headline">
                <SmallInput value={p.headline || ""} onChange={v => onUpdate("headline", v)} placeholder="Big Announcement!" />
            </Group>
            <Group title="Subheadline">
                <SmallInput value={p.subheadline || ""} onChange={v => onUpdate("subheadline", v)} placeholder="Something amazing is coming." />
            </Group>
            <Group title="Logo URL">
                <SmallInput value={p.logoUrl || ""} onChange={v => onUpdate("logoUrl", v)} placeholder="https://cdn.../logo.png" />
            </Group>
        </>
    );

    if (block.type === "footer") return (
        <>
            <Group title="Footer Text">
                <textarea
                    value={p.content || ""}
                    onChange={e => onUpdate("content", e.target.value)}
                    rows={3}
                    style={{ ...inp, resize: "vertical" }}
                />
            </Group>
            <Group title="Logo URL">
                <SmallInput value={p.logoUrl || ""} onChange={v => onUpdate("logoUrl", v)} placeholder="https://cdn.../logo.png" />
            </Group>
        </>
    );

    if (block.type === "spacer") return (
        <Group title="Height (px)">
            <SmallInput type="number" min={4} max={400} value={p.height || 32} onChange={v => onUpdate("height", v)} />
        </Group>
    );

    if (block.type === "html") return (
        <Group title="Custom HTML">
            <textarea
                value={p.content || ""}
                onChange={e => onUpdate("content", e.target.value)}
                rows={8}
                style={{ ...inp, resize: "vertical", fontFamily: "monospace", fontSize: 12 }}
            />
        </Group>
    );

    return <div style={{ color: "#94A3B8", fontSize: 13, padding: "20px 0", textAlign: "center" }}>No content settings for this block type.</div>;
}

// ─── STYLE TAB ────────────────────────────────────────────────────────────────

function StyleTab({ block, onUpdate }: { block: DesignBlock; onUpdate: (k: string, v: any) => void }) {
    const p = block.props;
    const isText = ["text", "floating-text", "hero", "footer"].includes(block.type);

    return (
        <>
            {isText && (
                <>
                    <FontRow value={p.fontFamily} onChange={v => onUpdate("fontFamily", v)} />
                    <Group title="Font Size (px)">
                        <Row gap={8}>
                            <button onClick={() => onUpdate("fontSize", Math.max(8, (p.fontSize || 16) - 2))}
                                style={{ width: 32, height: 32, border: "1px solid #E2E8F0", borderRadius: 6, cursor: "pointer", background: "#fff", flexShrink: 0 }}>−</button>
                            <SmallInput type="number" min={8} max={96} value={p.fontSize || 16} onChange={v => onUpdate("fontSize", v)} />
                            <button onClick={() => onUpdate("fontSize", Math.min(96, (p.fontSize || 16) + 2))}
                                style={{ width: 32, height: 32, border: "1px solid #E2E8F0", borderRadius: 6, cursor: "pointer", background: "#fff", flexShrink: 0 }}>+</button>
                        </Row>
                    </Group>
                    <ColorRow label="Text Color" value={p.color || p.textColor || "#475569"} onChange={v => onUpdate(p.textColor !== undefined ? "textColor" : "color", v)} />
                    <Group title="Font Weight">
                        <select value={p.fontWeight || "normal"} onChange={e => onUpdate("fontWeight", e.target.value)} style={{ ...inp, cursor: "pointer" }}>
                            {["300", "normal", "500", "600", "700", "800", "900"].map(w => (
                                <option key={w} value={w}>{w === "normal" ? "Regular (400)" : w}</option>
                            ))}
                        </select>
                    </Group>
                    <Group title="Line Height">
                        <SmallInput type="number" min={1} max={3} value={p.lineHeight || 1.6} onChange={v => onUpdate("lineHeight", v)} />
                    </Group>
                    <AlignRow value={p.align || "left"} onChange={v => onUpdate("align", v)} />
                    <Divider />
                </>
            )}

            {block.type === "image" && (
                <>
                    <Group title="Width (%)">
                        <SmallInput type="number" min={10} max={100} value={parseInt(String(p.width || "100"))} onChange={v => onUpdate("width", `${v}%`)} />
                    </Group>
                    <AlignRow value={p.align || "center"} onChange={v => onUpdate("align", v)} />
                    <Divider />
                </>
            )}

            {block.type === "button" && (
                <>
                    <ColorRow label="Button Color" value={p.backgroundColor || "#6366F1"} onChange={v => onUpdate("backgroundColor", v)} />
                    <ColorRow label="Text Color" value={p.color || "#ffffff"} onChange={v => onUpdate("color", v)} />
                    <FontRow value={p.fontFamily} onChange={v => onUpdate("fontFamily", v)} />
                    <Group title="Font Size (px)">
                        <SmallInput type="number" min={10} max={32} value={p.fontSize || 16} onChange={v => onUpdate("fontSize", v)} />
                    </Group>
                    <AlignRow value={p.align || "center"} onChange={v => onUpdate("align", v)} />
                    <Divider />
                </>
            )}

            {block.type === "hero" && (
                <>
                    <ColorRow label="Background" value={p.bgColor || "#6366F1"} onChange={v => onUpdate("bgColor", v)} />
                    <Divider />
                </>
            )}

            {block.type === "divider" && (
                <>
                    <ColorRow label="Line Color" value={p.color || "#E5E7EB"} onChange={v => onUpdate("color", v)} />
                    <Group title="Thickness (px)">
                        <SmallInput type="number" min={1} max={20} value={p.thickness || 1} onChange={v => onUpdate("thickness", v)} />
                    </Group>
                    <Divider />
                </>
            )}

            {/* Universal: Background + Border Radius + Padding */}
            <ColorRow label="Background" value={p.backgroundColor || p.bgColor || "transparent"} onChange={v => onUpdate(p.bgColor !== undefined ? "bgColor" : "backgroundColor", v)} />
            <Group title="Border Radius (px)">
                <SmallInput type="number" min={0} max={64} value={p.borderRadius || 0} onChange={v => onUpdate("borderRadius", v)} />
            </Group>
            <PaddingGrid props={p} onUpdate={onUpdate} />
        </>
    );
}

// ─── SETTINGS TAB ─────────────────────────────────────────────────────────────

function SettingsTab({ block, onUpdate, onDuplicate, onDelete }: {
    block: DesignBlock; onUpdate: (k: string, v: any) => void;
    onDuplicate: () => void; onDelete: () => void;
}) {
    return (
        <>
            <Group title="Block ID">
                <div style={{ ...inp, fontFamily: "monospace", fontSize: 11, color: "#94A3B8", background: "#F8FAFC", borderRadius: 8, padding: "8px 10px" }}>
                    {block.id}
                </div>
            </Group>
            <Group title="Block Type">
                <div style={{ ...inp, fontFamily: "monospace", fontSize: 12, color: "#6366F1", background: "#EEF2FF", borderRadius: 8, padding: "8px 10px" }}>
                    {block.type}
                </div>
            </Group>
            <Divider />
            <Group title="CSS Class (optional)">
                <SmallInput value={block.props.cssClass || ""} onChange={v => onUpdate("cssClass", v)} placeholder="custom-class" />
            </Group>
            <Divider />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button onClick={onDuplicate} style={{
                    width: "100%", padding: "10px", border: "1px solid #E2E8F0", borderRadius: 10,
                    background: "#fff", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                }}>
                    <Copy size={14} /> Duplicate Block
                </button>
                <button onClick={onDelete} style={{
                    width: "100%", padding: "10px", border: "1px solid #FCA5A5", borderRadius: 10,
                    background: "#FEF2F2", color: "#DC2626", fontSize: 13, fontWeight: 600, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                }}>
                    <Trash2 size={14} /> Delete Block
                </button>
            </div>
        </>
    );
}

// ─── PAGE SETTINGS (nothing selected) ────────────────────────────────────────

function PageSettings({ design, onThemeUpdate }: { design: DesignJSON; onThemeUpdate: (k: string, v: any) => void }) {
    const t = design.theme;
    return (
        <>
            <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 20, lineHeight: 1.6 }}>
                Global email settings. Changes apply to the entire template.
            </div>
            <Group title="Email Width (px)">
                <SmallInput type="number" min={400} max={800} value={t.contentWidth || 600} onChange={v => onThemeUpdate("contentWidth", v)} />
            </Group>
            <ColorRow label="Outer Background" value={t.background || "#F8F9FB"} onChange={v => onThemeUpdate("background", v)} />
            <ColorRow label="Header Background" value={t.headerBackground || "#ffffff"} onChange={v => onThemeUpdate("headerBackground", v)} />
            <ColorRow label="Body Background" value={t.bodyBackground || "#ffffff"} onChange={v => onThemeUpdate("bodyBackground", v)} />
            <ColorRow label="Footer Background" value={t.footerBackground || "#f8f9fb"} onChange={v => onThemeUpdate("footerBackground", v)} />
            <Divider />
            <Group title="Default Font">
                <select value={t.fontFamily || "Arial"} onChange={e => onThemeUpdate("fontFamily", e.target.value)} style={{ ...inp, cursor: "pointer" }}>
                    {EMAIL_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
            </Group>
            <ColorRow label="Primary Color" value={t.primaryColor || "#6366F1"} onChange={v => onThemeUpdate("primaryColor", v)} />
            <ColorRow label="Paragraph Color" value={t.paragraphColor || "#475569"} onChange={v => onThemeUpdate("paragraphColor", v)} />
        </>
    );
}

// ─── EMPTY STATE (click canvas to start) ──────────────────────────────────────

function EmptyState() {
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60%", gap: 12, padding: 24 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Settings size={22} style={{ color: "#6366F1" }} />
            </div>
            <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>No block selected</div>
                <div style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.6 }}>Click any block on the canvas to edit its properties</div>
            </div>
        </div>
    );
}

// ─── MAIN INSPECTOR PANEL ─────────────────────────────────────────────────────

interface InspectorPanelProps {
    selectedNode: { type: "block" | "page"; id: string } | null;
    design: DesignJSON;
    onUpdateBlockProp: (blockId: string, key: string, val: any) => void;
    onUpdateTheme: (key: string, val: any) => void;
    onDuplicateBlock: (blockId: string) => void;
    onDeleteBlock: (blockId: string) => void;
    onOpenUpload: (blockId: string) => void;
    width: number;
}

export function InspectorPanel({
    selectedNode, design, onUpdateBlockProp, onUpdateTheme,
    onDuplicateBlock, onDeleteBlock, onOpenUpload, width
}: InspectorPanelProps) {
    const [tab, setTab] = useState<"content" | "style" | "settings">("content");

    const allBlocks = [...design.headerBlocks, ...design.bodyBlocks, ...design.footerBlocks];
    const block = selectedNode?.type === "block"
        ? allBlocks.find(b => b.id === selectedNode.id) ?? null
        : null;

    const isPage = selectedNode?.type === "page";

    if (!selectedNode) return null; // Hidden when nothing selected

    const tabs: { key: "content" | "style" | "settings"; icon: React.ReactNode; label: string }[] = [
        { key: "content", icon: <FileText size={14} />, label: "Content" },
        { key: "style", icon: <Palette size={14} />, label: "Style" },
        { key: "settings", icon: <Settings size={14} />, label: "Settings" },
    ];

    return (
        <div style={{
            width, background: "#fff", borderLeft: "1px solid #E4E4E7",
            display: "flex", flexDirection: "column", flexShrink: 0,
            height: "100%", overflow: "hidden"
        }}>
            {/* Header */}
            <div style={{ padding: "14px 16px 0", borderBottom: "1px solid #F1F5F9", flexShrink: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
                    {isPage ? "Page Settings" : block ? `${block.type.charAt(0).toUpperCase() + block.type.slice(1)} Block` : "Properties"}
                </div>
                {!isPage && (
                    <div style={{ display: "flex", gap: 4, marginBottom: 0 }}>
                        {tabs.map(t => (
                            <button key={t.key} onClick={() => setTab(t.key)} style={{
                                flex: 1, padding: "7px 4px", border: "none", borderBottom: tab === t.key ? "2px solid #6366F1" : "2px solid transparent",
                                background: "transparent", color: tab === t.key ? "#6366F1" : "#94A3B8",
                                fontSize: 11, fontWeight: 700, cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                                transition: "all 0.15s"
                            }}>
                                {t.icon} {t.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
                {isPage && (
                    <PageSettings design={design} onThemeUpdate={onUpdateTheme} />
                )}
                {block && tab === "content" && (
                    <ContentTab
                        block={block}
                        onUpdate={(k, v) => onUpdateBlockProp(block.id, k, v)}
                        onOpenUpload={() => onOpenUpload(block.id)}
                    />
                )}
                {block && tab === "style" && (
                    <StyleTab
                        block={block}
                        onUpdate={(k, v) => onUpdateBlockProp(block.id, k, v)}
                    />
                )}
                {block && tab === "settings" && (
                    <SettingsTab
                        block={block}
                        onUpdate={(k, v) => onUpdateBlockProp(block.id, k, v)}
                        onDuplicate={() => onDuplicateBlock(block.id)}
                        onDelete={() => onDeleteBlock(block.id)}
                    />
                )}
                {!block && !isPage && <EmptyState />}
            </div>
        </div>
    );
}
