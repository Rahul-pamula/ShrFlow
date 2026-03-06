"use client";

import React, { useState, useRef } from "react";
import { GripVertical, Plus, Copy, Trash2, AlignLeft, AlignCenter, AlignRight, Bold, Italic } from "lucide-react";
import { DesignJSON, DesignColumn, DesignBlock, SelectedNode, BLOCK_DEFAULTS, BlockType } from "./types";

// ── FLOATING TOOLBAR (for text editing) ────────────────────────────────────
function FloatingToolbar({ block, onUpdate, position }: { block: DesignBlock; onUpdate: (key: string, val: any) => void; position: { top: number; left: number } }) {
    const fonts = ["Inter", "Arial", "Georgia", "Verdana", "Times New Roman"];
    const sizes = [12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56];
    return (
        <div style={{
            position: "fixed", top: position.top, left: position.left, transform: "translate(-50%, -100%)", marginTop: -12, zIndex: 100,
            display: "flex", alignItems: "center", gap: 12, padding: "8px 16px", height: 48,
            background: "#fff", borderRadius: 12, boxShadow: "0 12px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.04)",
            border: "1px solid rgba(0,0,0,0.05)", fontSize: 13,
            animation: "fadeSlideUp 0.15s ease-out forwards",
        }}>
            <div style={{ display: "flex", gap: 8 }}>
                <select value={block.props.fontFamily || "Inter"} onChange={(e) => onUpdate("fontFamily", e.target.value)}
                    style={{ border: "none", borderRadius: 6, padding: "6px", fontSize: 13, background: "#F1F5F9", color: "#374151", cursor: "pointer", outline: "none", width: 90 }}>
                    {fonts.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <select value={block.props.fontSize || 16} onChange={(e) => onUpdate("fontSize", +e.target.value)}
                    style={{ border: "none", borderRadius: 6, padding: "6px", fontSize: 13, background: "#F1F5F9", color: "#374151", width: 60, cursor: "pointer", outline: "none" }}>
                    {sizes.map(s => <option key={s} value={s}>{s}px</option>)}
                </select>
            </div>

            <div style={{ width: 1, height: 24, background: "#E5E7EB" }} />

            <div style={{ display: "flex", gap: 4 }}>
                {[
                    { icon: <Bold size={15} strokeWidth={2.5} />, key: "fontWeight", active: block.props.fontWeight === "bold", toggle: block.props.fontWeight === "bold" ? "normal" : "bold" },
                    { icon: <Italic size={15} />, key: "fontStyle", active: block.props.fontStyle === "italic", toggle: block.props.fontStyle === "italic" ? "normal" : "italic" },
                ].map((b, i) => (
                    <button key={i} onClick={() => onUpdate(b.key, b.toggle)}
                        style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", border: "none", borderRadius: 8, cursor: "pointer", background: b.active ? "#EEF2FF" : "transparent", color: b.active ? "#6366F1" : "#64748B", transition: "all 0.1s" }}>
                        {b.icon}
                    </button>
                ))}
            </div>

            <div style={{ width: 1, height: 24, background: "#E5E7EB" }} />

            <div style={{ display: "flex", gap: 4 }}>
                {[
                    { val: "left", icon: <AlignLeft size={15} /> },
                    { val: "center", icon: <AlignCenter size={15} /> },
                    { val: "right", icon: <AlignRight size={15} /> },
                ].map((a) => (
                    <button key={a.val} onClick={() => onUpdate("align", a.val)}
                        style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", border: "none", borderRadius: 8, cursor: "pointer", background: block.props.align === a.val ? "#EEF2FF" : "transparent", color: block.props.align === a.val ? "#6366F1" : "#64748B", transition: "all 0.1s" }}>
                        {a.icon}
                    </button>
                ))}
            </div>
        </div>
    );
}

// ── FLOATING BLOCK HEADER (replaces side controls) ─────────────────────────
function BlockHeader({ block, onDuplicate, onDelete }: { block: DesignBlock; onDuplicate: () => void; onDelete: () => void }) {
    const [hoverDelete, setHoverDelete] = useState(false);
    return (
        <div style={{
            position: "absolute", top: -46, left: -2, right: -2, height: 40,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "#fff", borderRadius: 8, padding: "0 12px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.03)",
            border: "1px solid #E5E7EB", zIndex: 40,
            animation: "fadeSlideUp 0.15s ease-out forwards",
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <GripVertical size={14} color="#94A3B8" style={{ cursor: "grab" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {BLOCK_DEFAULTS[block.type]?.label || block.type}
                </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button onClick={onDuplicate} title="Duplicate"
                    style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "none", borderRadius: 6, cursor: "pointer", background: "transparent", color: "#64748B" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#F1F5F9"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <Copy size={13} />
                </button>
                <button onClick={onDelete} title="Delete"
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#FEE2E2"; e.currentTarget.style.color = "#EF4444"; setHoverDelete(true); }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748B"; setHoverDelete(false); }}
                    style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "none", borderRadius: 6, cursor: "pointer", background: "transparent", color: "#64748B", transition: "all 0.1s" }}>
                    <Trash2 size={13} />
                </button>
            </div>
        </div>
    );
}

// ── EDITABLE BLOCK RENDERER ────────────────────────────────────────────────
function EditableBlock({ block, isSelected, isHovered, onSelect, onHover, onLeave, onUpdate, onDuplicate, onDelete }: {
    block: DesignBlock; isSelected: boolean; isHovered: boolean;
    onSelect: () => void; onHover: () => void; onLeave: () => void;
    onUpdate: (key: string, val: any) => void; onDuplicate: () => void; onDelete: () => void;
}) {
    const blockRef = useRef<HTMLDivElement>(null);
    const [toolbarPos, setToolbarPos] = useState<{ top: number; left: number } | null>(null);

    const handleSelect = () => {
        onSelect();
        if (block.type === "text" && blockRef.current) {
            const rect = blockRef.current.getBoundingClientRect();
            setToolbarPos({ top: rect.top, left: rect.left + rect.width / 2 });
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
        onUpdate("content", e.currentTarget.innerText);
        // don't hide toolbar immediately to allow button clicks; selection change handles it usually.
    };

    const borderStyle = isSelected
        ? "2px solid #6366F1"
        : isHovered
            ? "2px solid #C7D2FE"
            : "2px solid transparent";

    const glowStyle = isSelected ? "0 0 0 4px rgba(99,102,241,0.1)" : "none";

    const renderBlock = () => {
        const p = block.props;
        switch (block.type) {
            case "text":
                return (
                    <div
                        contentEditable={isSelected}
                        suppressContentEditableWarning
                        onBlur={handleBlur}
                        style={{
                            fontSize: p.fontSize || 16, color: p.color || "#374151",
                            textAlign: (p.align as any) || "left", fontWeight: p.fontWeight || "normal",
                            fontStyle: p.fontStyle || "normal", fontFamily: p.fontFamily || "inherit",
                            lineHeight: 1.6, outline: "none", minHeight: 24, cursor: isSelected ? "text" : "pointer",
                            padding: "4px 0",
                        }}
                    >
                        {p.content || ""}
                    </div>
                );
            case "image":
                return (
                    <div style={{ textAlign: (p.align as any) || "center" }}>
                        <img src={p.src || "https://placehold.co/540x200"} alt={p.alt || ""} style={{ maxWidth: p.width || "100%", height: "auto", borderRadius: 4, display: "inline-block", verticalAlign: "middle" }} />
                    </div>
                );
            case "button":
                return (
                    <div style={{ textAlign: (p.align as any) || "center" }}>
                        <a style={{
                            display: "inline-block", padding: `${p.paddingV || 14}px ${p.paddingH || 28}px`,
                            background: p.backgroundColor || "#6366F1", color: p.color || "#fff",
                            borderRadius: p.borderRadius || 8, textDecoration: "none",
                            fontWeight: 600, fontSize: 14, cursor: "default",
                        }}>{p.text || "Button"}</a>
                    </div>
                );
            case "divider":
                return <div style={{ padding: "16px 0" }}><div style={{ borderTop: `${p.thickness || 1}px solid ${p.color || "#E5E7EB"}`, width: "100%" }} /></div>;
            case "spacer":
                return <div style={{ height: p.height || 32 }} />;
            case "social":
                return (
                    <div style={{ textAlign: (p.align as any) || "center", display: "flex", justifyContent: p.align || "center", gap: 12 }}>
                        {(p.icons || []).map((icon: any, i: number) => (
                            <div key={i} style={{ width: 36, height: 36, borderRadius: 8, background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#64748B" }}>
                                {icon.platform?.[0]?.toUpperCase() || "?"}
                            </div>
                        ))}
                    </div>
                );
            case "hero":
                return (
                    <div style={{ background: p.bgColor || "#6366F1", padding: "40px 24px", borderRadius: 12, textAlign: "center" }}>
                        <div style={{ fontSize: 28, fontWeight: 700, color: p.textColor || "#fff", marginBottom: 8 }}>{p.headline || "Hero"}</div>
                        <div style={{ fontSize: 16, color: "rgba(255,255,255,0.8)" }}>{p.subheadline || ""}</div>
                    </div>
                );
            case "footer":
                return (
                    <div style={{ fontSize: p.fontSize || 12, color: p.color || "#9CA3AF", textAlign: (p.align as any) || "center", lineHeight: 1.6 }}>
                        {p.content || "Footer"}
                    </div>
                );
            default:
                return <div>Unknown block</div>;
        }
    };

    return (
        <div
            ref={blockRef}
            onClick={(e) => { e.stopPropagation(); handleSelect(); }}
            onMouseEnter={onHover}
            onMouseLeave={onLeave}
            style={{
                position: "relative", marginBottom: 2,
                border: borderStyle,
                borderRadius: 8,
                transition: "all 0.15s ease-out", cursor: "pointer",
                boxShadow: glowStyle,
            }}
        >
            {isSelected && <BlockHeader block={block} onDuplicate={onDuplicate} onDelete={onDelete} />}
            {isSelected && toolbarPos && block.type === "text" && (
                <FloatingToolbar block={block} onUpdate={onUpdate} position={toolbarPos} />
            )}

            {/* Container to prevent collapsing margins inside the border */}
            <div style={{ padding: "4px" }}>
                {renderBlock()}
            </div>
        </div>
    );
}

// ── CANVAS COMPONENT ───────────────────────────────────────────────────────
export default function EditorCanvas({
    design, selectedNode, hoveredBlock, viewMode,
    onSelectNode, onHoverBlock, onLeaveBlock,
    onUpdateBlockProp, onAddBlockToCol, onDuplicateBlock, onDeleteBlock,
}: {
    design: DesignJSON; selectedNode: SelectedNode | null; hoveredBlock: string | null; viewMode: "desktop" | "mobile";
    onSelectNode: (node: SelectedNode | null) => void; onHoverBlock: (id: string) => void; onLeaveBlock: () => void;
    onUpdateBlockProp: (blockId: string, key: string, val: any) => void;
    onAddBlockToCol: (colId: string) => void; onDuplicateBlock: (blockId: string) => void; onDeleteBlock: (blockId: string) => void;
}) {
    const findColForBlock = (blockId: string): string | null => {
        for (const row of design.rows) for (const col of row.columns) for (const blk of col.blocks) if (blk.id === blockId) return col.id;
        return null;
    };

    return (
        <div style={{
            flex: 1, overflow: "auto", display: "flex", justifyContent: "center",
            padding: "60px 20px", background: "#EEF2F7", // Slightly darker tint for outer canvas
        }}
            onClick={() => onSelectNode(null)} // Click outside to deselect
        >
            <div data-canvas style={{
                width: viewMode === "desktop" ? 600 : 375, transition: "width 0.3s ease",
                position: "relative",
            }}>
                {/* Canvas email container */}
                <div style={{
                    background: design.theme.background || "#ffffff",
                    borderRadius: 16, overflow: "visible", // visible so headers/toolbars can float outside
                    boxShadow: "0 20px 50px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)",
                    minHeight: 400,
                }}>
                    {design.rows.length === 0 ? (
                        <div style={{ padding: "80px 40px", textAlign: "center" }}>
                            <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.3 }}>📬</div>
                            <div style={{ fontSize: 18, color: "#475569", fontWeight: 500 }}>Your canvas is empty</div>
                            <div style={{ fontSize: 14, color: "#94A3B8", marginTop: 8 }}>Drag blocks from the left sidebar to start building</div>
                        </div>
                    ) : (
                        design.rows.map((row) => (
                            <div
                                key={row.id}
                                onClick={(e) => { e.stopPropagation(); onSelectNode({ type: "row", id: row.id }); }}
                                style={{
                                    background: row.settings.backgroundColor || "transparent",
                                    paddingTop: row.settings.paddingTop || 0,
                                    paddingBottom: row.settings.paddingBottom || 0,
                                    paddingLeft: row.settings.paddingLeft || 0,
                                    paddingRight: row.settings.paddingRight || 0,
                                    maxWidth: design.theme.contentWidth || 600,
                                    margin: "0 auto",
                                    border: selectedNode?.id === row.id ? "1px dashed #A5B4FC" : "1px dashed transparent",
                                    transition: "border-color 0.15s ease-out",
                                }}
                            >
                                <div style={{ display: "flex", flexWrap: viewMode === "mobile" ? "wrap" : "nowrap" }}>
                                    {row.columns.map((col) => (
                                        <div
                                            key={col.id}
                                            style={{ flex: viewMode === "desktop" ? col.width : "100%", minHeight: 40, padding: "8px" }}
                                            onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.background = "rgba(99,102,241,0.04)"; }}
                                            onDragLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                            onDrop={(e) => {
                                                e.currentTarget.style.background = "transparent";
                                                const bt = e.dataTransfer.getData("blockType") as BlockType;
                                                if (bt) { e.preventDefault(); onAddBlockToCol(col.id); }
                                            }}
                                        >
                                            {col.blocks.length === 0 && (
                                                <div style={{
                                                    padding: "24px 16px", textAlign: "center", border: "1px dashed #CBD5E1",
                                                    borderRadius: 8, color: "#94A3B8", fontSize: 13, fontWeight: 500,
                                                }}>
                                                    Drop block here
                                                </div>
                                            )}
                                            {col.blocks.map((block) => (
                                                <EditableBlock
                                                    key={block.id}
                                                    block={block}
                                                    isSelected={selectedNode?.id === block.id}
                                                    isHovered={hoveredBlock === block.id}
                                                    onSelect={() => onSelectNode({ type: "block", id: block.id })}
                                                    onHover={() => onHoverBlock(block.id)}
                                                    onLeave={onLeaveBlock}
                                                    onUpdate={(key, val) => onUpdateBlockProp(block.id, key, val)}
                                                    onDuplicate={() => onDuplicateBlock(block.id)}
                                                    onDelete={() => onDeleteBlock(block.id)}
                                                />
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        [contenteditable]:empty:before { content: "Type something..."; color: #9CA3AF; cursor: text; }
      `}</style>
        </div>
    );
}
