"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Type, ImageIcon, Square, Minus, Layout, Loader2, ArrowLeft,
    GripVertical, Save, Plus, Undo2, Redo2, Eye,
    Share2, Settings2, Monitor, Smartphone, Layers, Blocks,
    Trash2, Copy, ChevronDown
} from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import EditorCanvas from "./EditorCanvas";
import {
    DesignJSON, DesignRow, DesignColumn, DesignBlock, BlockType,
    SelectedNode, DEFAULT_THEME, BLOCK_DEFAULTS, ROW_PRESETS,
    RowPresetKey, createRowPreset, uid, clone,
} from "./types";

// ── BLOCK ICONS ────────────────────────────────────────────────────────────
const BLOCK_ICONS: Record<BlockType, React.ReactNode> = {
    text: <Type size={20} />, image: <ImageIcon size={20} />, button: <Square size={20} />,
    divider: <Minus size={20} />, spacer: <Layout size={20} opacity={.4} />,
    social: <Share2 size={20} />, hero: <Monitor size={20} />, footer: <Settings2 size={20} />,
};

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function PremiumEmailBuilder() {
    const params = useParams();
    const router = useRouter();
    const templateId = params.id as string;

    const [name, setName] = useState("Untitled Template");
    const [subject, setSubject] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [design, setDesign] = useState<DesignJSON>({ theme: DEFAULT_THEME, rows: [] });
    const [history, setHistory] = useState<DesignJSON[]>([]);
    const [future, setFuture] = useState<DesignJSON[]>([]);
    const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);
    const [hoveredBlock, setHoveredBlock] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
    const [leftTab, setLeftTab] = useState<"blocks" | "layers">("blocks");
    const [inspectorTab, setInspectorTab] = useState<"content" | "style" | "settings">("content");
    const [showPreview, setShowPreview] = useState(false);
    const [compiledHtml, setCompiledHtml] = useState("");

    const pushDesign = useCallback((modifier: (d: DesignJSON) => DesignJSON) => {
        setDesign((prev) => {
            const next = modifier(clone(prev));
            setHistory((h) => [...h, clone(prev)].slice(-20));
            setFuture([]);
            return next;
        });
    }, []);

    const undo = () => { if (!history.length) return; setFuture((f) => [clone(design), ...f]); setDesign(history[history.length - 1]); setHistory((h) => h.slice(0, -1)); };
    const redo = () => { if (!future.length) return; setHistory((h) => [...h, clone(design)]); setDesign(future[0]); setFuture((f) => f.slice(1)); };

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "z") { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
            if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); handleSave(); }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [design, history, future]);

    const compileForPreview = () => {
        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        fetch(`${API}/templates/compile/preview`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ design_json: design }) })
            .then(r => r.json()).then(d => { if (d.html) { setCompiledHtml(d.html); setShowPreview(true); } });
    };

    useEffect(() => {
        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
        fetch(`${API}/templates/${templateId}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => {
                setName(data.name || "Untitled");
                setSubject(data.subject || "");
                if (data.design_json?.rows) setDesign(data.design_json);
                setLoading(false);
            }).catch(() => setLoading(false));
    }, [templateId]);

    const handleSave = async () => {
        setSaving(true);
        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
        try {
            await fetch(`${API}/templates/${templateId}`, {
                method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name, subject, design_json: design, template_type: "block", schema_version: "2.0.0" }),
            });
        } finally { setSaving(false); }
    };

    const addBlockToCol = (colId: string, blockType: BlockType = "text") => {
        pushDesign(d => {
            for (const row of d.rows) for (const col of row.columns)
                if (col.id === colId) col.blocks.push({ id: `blk-${uid()}`, type: blockType, props: { ...BLOCK_DEFAULTS[blockType].defaults } });
            return d;
        });
    };

    const duplicateBlock = (blockId: string) => {
        pushDesign(d => {
            for (const row of d.rows) for (const col of row.columns) {
                const idx = col.blocks.findIndex(b => b.id === blockId);
                if (idx !== -1) { col.blocks.splice(idx + 1, 0, { ...clone(col.blocks[idx]), id: `blk-${uid()}` }); break; }
            }
            return d;
        });
    };

    const deleteBlock = (blockId: string) => {
        pushDesign(d => { for (const row of d.rows) for (const col of row.columns) col.blocks = col.blocks.filter(b => b.id !== blockId); return d; });
        if (selectedNode?.id === blockId) setSelectedNode(null);
    };

    const deleteRow = (rowId: string) => { pushDesign(d => { d.rows = d.rows.filter(r => r.id !== rowId); return d; }); if (selectedNode?.id === rowId) setSelectedNode(null); };

    const updateBlockProp = (blockId: string, key: string, val: any) => {
        pushDesign(d => { for (const row of d.rows) for (const col of row.columns) { const b = col.blocks.find(b => b.id === blockId); if (b) b.props[key] = val; } return d; });
    };

    const updateRowSetting = (rowId: string, key: string, val: any) => {
        pushDesign(d => { const r = d.rows.find(r => r.id === rowId); if (r) (r.settings as any)[key] = val; return d; });
    };

    const onDragEnd = (result: DropResult) => {
        const { source, destination, type } = result;
        if (!destination) return;
        pushDesign(d => {
            if (type === "ROW") { const [moved] = d.rows.splice(source.index, 1); d.rows.splice(destination.index, 0, moved); }
            else if (type === "BLOCK") {
                const sCol = source.droppableId.replace("blocks-", ""), dCol = destination.droppableId.replace("blocks-", "");
                let sc: DesignColumn | null = null, dc: DesignColumn | null = null;
                for (const r of d.rows) for (const c of r.columns) { if (c.id === sCol) sc = c; if (c.id === dCol) dc = c; }
                if (sc && dc) { const [moved] = sc.blocks.splice(source.index, 1); dc.blocks.splice(destination.index, 0, moved); }
            }
            return d;
        });
    };

    const getSelected = () => {
        if (!selectedNode) return {};
        for (const row of design.rows) {
            if (selectedNode.type === "row" && row.id === selectedNode.id) return { row };
            for (const col of row.columns) {
                if (selectedNode.type === "column" && col.id === selectedNode.id) return { col, row };
                for (const block of col.blocks) if (selectedNode.type === "block" && block.id === selectedNode.id) return { block, col, row };
            }
        }
        return {};
    };

    if (loading) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#F8FAFC" }}>
            <Loader2 size={32} style={{ color: "#6366F1", animation: "spin 1s linear infinite" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );

    const sel = getSelected();

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#F8FAFC", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", color: "#1E293B" }}>

            {/* ════ TOP BAR ════ */}
            <div style={{
                height: 64, display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "space-between",
                padding: "0 24px", background: "#ffffff", borderBottom: "1px solid #E2E8F0", flexShrink: 0, zIndex: 50,
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <button onClick={() => router.push("/templates")} style={{ display: "flex", alignItems: "center", gap: 6, border: "1px solid #E2E8F0", background: "#fff", color: "#64748B", cursor: "pointer", fontSize: 13, fontWeight: 500, padding: "8px 12px", borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
                        <ArrowLeft size={16} /> <span>Back</span>
                    </button>
                    <div style={{ width: 1, height: 24, background: "#E2E8F0" }} />
                    <input value={name} onChange={e => setName(e.target.value)} style={{ border: "none", fontSize: 16, fontWeight: 600, color: "#0F172A", outline: "none", background: "transparent", width: 300 }} />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#F1F5F9", borderRadius: 10, padding: 4 }}>
                    {(["desktop", "mobile"] as const).map(m => (
                        <button key={m} onClick={() => setViewMode(m)} style={{
                            display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500,
                            background: viewMode === m ? "#fff" : "transparent", color: viewMode === m ? "#0F172A" : "#64748B",
                            boxShadow: viewMode === m ? "0 1px 3px rgba(0,0,0,0.1)" : "none", transition: "all 0.15s ease",
                        }}>{m === "desktop" ? <Monitor size={16} /> : <Smartphone size={16} />} {m.charAt(0).toUpperCase() + m.slice(1)}</button>
                    ))}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button onClick={undo} disabled={!history.length} style={{ ...iconBtn, color: history.length ? "#64748B" : "#CBD5E1" }}><Undo2 size={18} /></button>
                    <button onClick={redo} disabled={!future.length} style={{ ...iconBtn, color: future.length ? "#64748B" : "#CBD5E1" }}><Redo2 size={18} /></button>
                    <div style={{ width: 1, height: 24, background: "#E2E8F0", margin: "0 8px" }} />
                    <button onClick={compileForPreview} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#475569", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}><Eye size={16} /> Preview</button>
                    <button onClick={handleSave} disabled={saving} style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "10px 24px", border: "none", borderRadius: 10,
                        background: "#6366F1", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600,
                        opacity: saving ? 0.8 : 1, transition: "all 0.15s ease", boxShadow: "0 4px 12px rgba(99, 102, 241, 0.2)",
                    }}>
                        <Save size={16} /> {saving ? "Saving…" : "Save Changes"}
                    </button>
                </div>
            </div>

            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                {/* ════ LEFT SIDEBAR ════ */}
                <div style={{ width: 280, background: "#ffffff", borderRight: "1px solid #E2E8F0", display: "flex", flexDirection: "column", flexShrink: 0, boxShadow: "2px 0 8px rgba(0,0,0,0.02)", zIndex: 10 }}>
                    {/* Tabs */}
                    <div style={{ display: "flex", borderBottom: "1px solid #F1F5F9", padding: "8px 16px 0" }}>
                        {([{ key: "blocks", label: "Blocks", icon: <Blocks size={16} /> }, { key: "layers", label: "Layers", icon: <Layers size={16} /> }] as const).map(t => (
                            <button key={t.key} onClick={() => setLeftTab(t.key as any)} style={{
                                flex: 1, display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", gap: 8, padding: "14px 0",
                                border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                                color: leftTab === t.key ? "#6366F1" : "#94A3B8",
                                borderBottom: leftTab === t.key ? "2px solid #6366F1" : "2px solid transparent", transition: "all 0.2s ease",
                            }}>{t.icon} {t.label}</button>
                        ))}
                    </div>

                    <div style={{ flex: 1, overflow: "auto", padding: "24px 20px" }}>
                        {leftTab === "blocks" && (
                            <>
                                <SectionLabel>Content Blocks</SectionLabel>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
                                    {(Object.keys(BLOCK_DEFAULTS) as BlockType[]).map(key => (
                                        <div key={key} draggable onDragStart={e => e.dataTransfer.setData("blockType", key)}
                                            className="block-card"
                                            style={{
                                                display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
                                                padding: "20px 12px", background: "#ffffff", borderRadius: 12, cursor: "grab",
                                                border: "1px solid #F1F5F9", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.02)",
                                                transition: "all 0.2s ease-out",
                                            }}>
                                            <div style={{ color: "#6366F1", background: "#EEF2FF", padding: "12px", borderRadius: "10px" }}>{BLOCK_ICONS[key]}</div>
                                            <span style={{ fontSize: 13, fontWeight: 500, color: "#334155" }}>{BLOCK_DEFAULTS[key].label}</span>
                                        </div>
                                    ))}
                                </div>

                                <SectionLabel>Row Layouts</SectionLabel>
                                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                    {(Object.entries(ROW_PRESETS) as [RowPresetKey, any][]).map(([key, preset]) => (
                                        <button key={key} onClick={() => pushDesign(d => { d.rows.push(createRowPreset(key)); return d; })}
                                            className="row-card"
                                            style={{
                                                display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "16px",
                                                background: "#ffffff", border: "1px solid #F1F5F9", borderRadius: 12, cursor: "pointer",
                                                boxShadow: "0 2px 4px -1px rgba(0,0,0,0.03)", transition: "all 0.2s ease-out", textAlign: "left",
                                            }}>
                                            {/* Visual column preview */}
                                            <div style={{ display: "flex", gap: 4, width: 44 }}>
                                                {preset.widths.map((w: number, i: number) => (
                                                    <div key={i} style={{ flex: w, height: 16, background: "#C7D2FE", borderRadius: 3 }} />
                                                ))}
                                            </div>
                                            <span style={{ fontSize: 13, fontWeight: 500, color: "#334155" }}>{preset.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}

                        {leftTab === "layers" && (
                            <DragDropContext onDragEnd={onDragEnd}>
                                <Droppable droppableId="rows" type="ROW">
                                    {provided => (
                                        <div ref={provided.innerRef} {...provided.droppableProps}>
                                            {design.rows.map((row, ri) => (
                                                <Draggable key={row.id} draggableId={row.id} index={ri}>
                                                    {rowProv => (
                                                        <div ref={rowProv.innerRef} {...rowProv.draggableProps} style={{ ...rowProv.draggableProps.style, marginBottom: 12 }}>
                                                            <div style={{ background: selectedNode?.id === row.id ? "#F8FAFC" : "#ffffff", border: `1px solid ${selectedNode?.id === row.id ? "#CBD5E1" : "#E2E8F0"}`, borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px" }}>
                                                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                                        <span {...rowProv.dragHandleProps} style={{ color: "#94A3B8", cursor: "grab", marginTop: 2 }}><GripVertical size={16} /></span>
                                                                        <span onClick={() => setSelectedNode({ type: "row", id: row.id })} style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", cursor: "pointer" }}>Row <span style={{ color: "#94A3B8", fontWeight: 400 }}>· {row.columns.length} col</span></span>
                                                                    </div>
                                                                    <div style={{ display: "flex", gap: 4 }}>
                                                                        <button onClick={() => deleteRow(row.id)} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", padding: 4 }}><Trash2 size={14} /></button>
                                                                    </div>
                                                                </div>
                                                                <div style={{ display: "flex", gap: 6, padding: "0 14px 14px 14px" }}>
                                                                    {row.columns.map(col => (
                                                                        <Droppable key={col.id} droppableId={`blocks-${col.id}`} type="BLOCK">
                                                                            {(colProv, colSnap) => (
                                                                                <div ref={colProv.innerRef} {...colProv.droppableProps}
                                                                                    onDragOver={e => e.preventDefault()}
                                                                                    onDrop={e => { const bt = e.dataTransfer.getData("blockType") as BlockType; if (bt && BLOCK_DEFAULTS[bt]) { e.preventDefault(); addBlockToCol(col.id, bt); } }}
                                                                                    style={{ flex: col.width, minHeight: 40, borderRadius: 8, padding: "6px", background: colSnap.isDraggingOver ? "#F1F5F9" : "#F8FAFC", border: "1px dashed #CBD5E1", transition: "all 0.15s ease" }}>
                                                                                    {col.blocks.map((block, bi) => (
                                                                                        <Draggable key={block.id} draggableId={block.id} index={bi}>
                                                                                            {blkProv => (
                                                                                                <div ref={blkProv.innerRef} {...blkProv.draggableProps} {...blkProv.dragHandleProps}
                                                                                                    onClick={e => { e.stopPropagation(); setSelectedNode({ type: "block", id: block.id }); }}
                                                                                                    style={{
                                                                                                        padding: "8px 10px", marginBottom: 4, borderRadius: 6, fontSize: 12, fontWeight: 500,
                                                                                                        display: "flex", alignItems: "center", gap: 8,
                                                                                                        background: selectedNode?.id === block.id ? "#EEF2FF" : "#ffffff",
                                                                                                        border: `1px solid ${selectedNode?.id === block.id ? "#C7D2FE" : "#E2E8F0"}`,
                                                                                                        color: "#334155", cursor: "grab", boxShadow: "0 1px 2px rgba(0,0,0,0.02)", ...blkProv.draggableProps.style,
                                                                                                    }}>
                                                                                                    <span style={{ color: "#6366F1", flexShrink: 0, opacity: 0.8 }}>{BLOCK_ICONS[block.type]}</span>
                                                                                                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{BLOCK_DEFAULTS[block.type]?.label}</span>
                                                                                                </div>
                                                                                            )}
                                                                                        </Draggable>
                                                                                    ))}
                                                                                    {colProv.placeholder}
                                                                                    {col.blocks.length === 0 && <div style={{ fontSize: 11, color: "#94A3B8", textAlign: "center", padding: "12px 0" }}>Drop block</div>}
                                                                                </div>
                                                                            )}
                                                                        </Droppable>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                                <button onClick={() => pushDesign(d => { d.rows.push(createRowPreset("1col")); return d; })}
                                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "16px", marginTop: 12, border: "1px dashed #CBD5E1", borderRadius: 12, background: "#F8FAFC", color: "#64748B", cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.15s ease" }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#94A3B8"; e.currentTarget.style.background = "#F1F5F9"; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#CBD5E1"; e.currentTarget.style.background = "#F8FAFC"; }}>
                                    <Plus size={16} /> Add Row
                                </button>
                            </DragDropContext>
                        )}
                    </div>
                </div>

                {/* ════ CANVAS ════ */}
                <EditorCanvas
                    design={design} selectedNode={selectedNode} hoveredBlock={hoveredBlock} viewMode={viewMode}
                    onSelectNode={setSelectedNode} onHoverBlock={setHoveredBlock} onLeaveBlock={() => setHoveredBlock(null)}
                    onUpdateBlockProp={updateBlockProp} onAddBlockToCol={addBlockToCol} onDuplicateBlock={duplicateBlock} onDeleteBlock={deleteBlock}
                />

                {/* ════ RIGHT INSPECTOR ════ */}
                <div style={{ width: 340, background: "#ffffff", borderLeft: "1px solid #E2E8F0", display: "flex", flexDirection: "column", flexShrink: 0, boxShadow: "-2px 0 8px rgba(0,0,0,0.02)", zIndex: 10 }}>
                    <div style={{ display: "flex", borderBottom: "1px solid #F1F5F9", padding: "8px 16px 0" }}>
                        {(["content", "style", "settings"] as const).map(t => (
                            <button key={t} onClick={() => setInspectorTab(t)} style={{
                                flex: 1, padding: "14px 0", border: "none", background: "none", cursor: "pointer",
                                fontSize: 13, fontWeight: 600, color: inspectorTab === t ? "#6366F1" : "#94A3B8",
                                borderBottom: inspectorTab === t ? "2px solid #6366F1" : "2px solid transparent", transition: "all 0.2s ease", textTransform: "capitalize",
                            }}>{t}</button>
                        ))}
                    </div>

                    <div style={{ flex: 1, overflow: "auto", padding: "24px" }}>
                        {!selectedNode && (
                            <div style={{ textAlign: "center", padding: "64px 24px" }}>
                                <div style={{ width: 56, height: 56, borderRadius: 16, background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                                    <Settings2 size={24} color="#94A3B8" />
                                </div>
                                <p style={{ fontSize: 15, color: "#334155", fontWeight: 600 }}>Select elements to style</p>
                                <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 8, lineHeight: 1.5 }}>Click on any block or row in the canvas to adjust properties.</p>
                            </div>
                        )}

                        {/* CONTENT TAB */}
                        {inspectorTab === "content" && selectedNode?.type === "block" && sel.block && (
                            <div>
                                <InspectorSection title={BLOCK_DEFAULTS[sel.block.type]?.label || "Block Content"}>
                                    {sel.block.type === "text" && (
                                        <FormGroup>
                                            <Label>Fallback Content</Label>
                                            <div style={{ fontSize: 12, color: "#64748B", marginBottom: 8 }}>Use the rich toolbar on the canvas to format text visually.</div>
                                            <textarea value={sel.block.props.content || ""} onChange={e => updateBlockProp(sel.block!.id, "content", e.target.value)}
                                                style={{ ...inputStyle, minHeight: 120, resize: "vertical" }} />
                                        </FormGroup>
                                    )}
                                    {sel.block.type === "image" && (
                                        <>
                                            <FormGroup>
                                                <Label>Image URL</Label>
                                                <input value={sel.block.props.src || ""} onChange={e => updateBlockProp(sel.block!.id, "src", e.target.value)} style={inputStyle} placeholder="https://..." />
                                                {sel.block.props.src && <img src={sel.block.props.src} alt="" style={{ width: "100%", borderRadius: 10, marginTop: 12, border: "1px solid #E2E8F0" }} />}
                                            </FormGroup>
                                            <FormGroup>
                                                <Label>Alt Text</Label>
                                                <input value={sel.block.props.alt || ""} onChange={e => updateBlockProp(sel.block!.id, "alt", e.target.value)} style={inputStyle} />
                                            </FormGroup>
                                        </>
                                    )}
                                    {sel.block.type === "button" && (
                                        <>
                                            <FormGroup><Label>Button Text</Label><input value={sel.block.props.text || ""} onChange={e => updateBlockProp(sel.block!.id, "text", e.target.value)} style={inputStyle} /></FormGroup>
                                            <FormGroup><Label>Link URL</Label><input value={sel.block.props.url || ""} onChange={e => updateBlockProp(sel.block!.id, "url", e.target.value)} style={inputStyle} placeholder="https://..." /></FormGroup>
                                        </>
                                    )}
                                    {sel.block.type === "hero" && (
                                        <>
                                            <FormGroup><Label>Headline</Label><input value={sel.block.props.headline || ""} onChange={e => updateBlockProp(sel.block!.id, "headline", e.target.value)} style={inputStyle} /></FormGroup>
                                            <FormGroup><Label>Subheadline</Label><input value={sel.block.props.subheadline || ""} onChange={e => updateBlockProp(sel.block!.id, "subheadline", e.target.value)} style={inputStyle} /></FormGroup>
                                        </>
                                    )}
                                    {sel.block.type === "spacer" && (
                                        <FormGroup><Label>Height</Label>
                                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                <input type="range" min={8} max={120} value={sel.block.props.height || 32} onChange={e => updateBlockProp(sel.block!.id, "height", +e.target.value)} style={{ flex: 1, accentColor: "#6366F1" }} />
                                                <span style={{ fontSize: 13, fontWeight: 500, color: "#334155", width: 40, textAlign: "right" }}>{sel.block.props.height || 32}px</span>
                                            </div>
                                        </FormGroup>
                                    )}
                                    {sel.block.type === "divider" && (
                                        <FormGroup>
                                            <Label>Color Picker</Label>
                                            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                                <div style={{ position: "relative", width: 36, height: 36, borderRadius: 8, overflow: "hidden", border: "1px solid #E2E8F0", flexShrink: 0 }}>
                                                    <input type="color" value={sel.block.props.color || "#E5E7EB"} onChange={e => updateBlockProp(sel.block!.id, "color", e.target.value)} style={{ position: "absolute", top: -8, left: -8, width: 56, height: 56, cursor: "pointer", border: "none" }} />
                                                </div>
                                                <input value={sel.block.props.color || ""} onChange={e => updateBlockProp(sel.block!.id, "color", e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} />
                                            </div>
                                        </FormGroup>
                                    )}
                                </InspectorSection>
                            </div>
                        )}

                        {inspectorTab === "content" && selectedNode?.type === "row" && sel.row && (
                            <InspectorSection title="Row">
                                <FormGroup>
                                    <Label>Background Color</Label>
                                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                        <div style={{ position: "relative", width: 36, height: 36, borderRadius: 8, overflow: "hidden", border: "1px solid #E2E8F0", flexShrink: 0 }}>
                                            <input type="color" value={sel.row.settings.backgroundColor || "#ffffff"} onChange={e => updateRowSetting(sel.row!.id, "backgroundColor", e.target.value)} style={{ position: "absolute", top: -8, left: -8, width: 56, height: 56, cursor: "pointer", border: "none" }} />
                                        </div>
                                        <input value={sel.row.settings.backgroundColor || ""} onChange={e => updateRowSetting(sel.row!.id, "backgroundColor", e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} />
                                    </div>
                                </FormGroup>
                            </InspectorSection>
                        )}

                        {/* STYLE TAB */}
                        {inspectorTab === "style" && selectedNode?.type === "block" && sel.block && (
                            <InspectorSection title="Design Values">
                                {["text", "button", "footer"].includes(sel.block.type) && (
                                    <>
                                        <FormGroup>
                                            <Label>Font Size</Label>
                                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                <input type="range" min={10} max={64} value={sel.block.props.fontSize || 16} onChange={e => updateBlockProp(sel.block!.id, "fontSize", +e.target.value)} style={{ flex: 1, accentColor: "#6366F1" }} />
                                                <span style={{ fontSize: 13, fontWeight: 500, color: "#334155", width: 40, textAlign: "right" }}>{sel.block.props.fontSize || 16}px</span>
                                            </div>
                                        </FormGroup>
                                        <FormGroup>
                                            <Label>Text Color</Label>
                                            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                                <div style={{ position: "relative", width: 36, height: 36, borderRadius: 8, overflow: "hidden", border: "1px solid #E2E8F0", flexShrink: 0 }}>
                                                    <input type="color" value={sel.block.props.color || "#374151"} onChange={e => updateBlockProp(sel.block!.id, "color", e.target.value)} style={{ position: "absolute", top: -8, left: -8, width: 56, height: 56, cursor: "pointer", border: "none" }} />
                                                </div>
                                                <input value={sel.block.props.color || ""} onChange={e => updateBlockProp(sel.block!.id, "color", e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} />
                                            </div>
                                        </FormGroup>
                                        <FormGroup>
                                            <Label>Alignment</Label>
                                            <div style={{ display: "flex", gap: 4, background: "#F1F5F9", borderRadius: 10, padding: 4 }}>
                                                {["left", "center", "right"].map(a => (
                                                    <button key={a} onClick={() => updateBlockProp(sel.block!.id, "align", a)} style={{
                                                        flex: 1, padding: "10px 0", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500,
                                                        background: sel.block!.props.align === a ? "#fff" : "transparent", color: sel.block!.props.align === a ? "#6366F1" : "#64748B",
                                                        boxShadow: sel.block!.props.align === a ? "0 1px 3px rgba(0,0,0,0.1)" : "none", transition: "all 0.15s ease", textTransform: "capitalize",
                                                    }}>{a}</button>
                                                ))}
                                            </div>
                                        </FormGroup>
                                    </>
                                )}
                                {sel.block.type === "button" && (
                                    <>
                                        <FormGroup>
                                            <Label>Button Color</Label>
                                            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                                <div style={{ position: "relative", width: 36, height: 36, borderRadius: 8, overflow: "hidden", border: "1px solid #E2E8F0", flexShrink: 0 }}>
                                                    <input type="color" value={sel.block.props.backgroundColor || "#6366F1"} onChange={e => updateBlockProp(sel.block!.id, "backgroundColor", e.target.value)} style={{ position: "absolute", top: -8, left: -8, width: 56, height: 56, cursor: "pointer" }} />
                                                </div>
                                                <input value={sel.block.props.backgroundColor || ""} onChange={e => updateBlockProp(sel.block!.id, "backgroundColor", e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} />
                                            </div>
                                        </FormGroup>
                                        <FormGroup>
                                            <Label>Border Radius</Label>
                                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                <input type="range" min={0} max={40} value={sel.block.props.borderRadius || 8} onChange={e => updateBlockProp(sel.block!.id, "borderRadius", +e.target.value)} style={{ flex: 1, accentColor: "#6366F1" }} />
                                                <span style={{ fontSize: 13, fontWeight: 500, color: "#334155", width: 40, textAlign: "right" }}>{sel.block.props.borderRadius || 8}px</span>
                                            </div>
                                        </FormGroup>
                                    </>
                                )}
                            </InspectorSection>
                        )}

                        {inspectorTab === "style" && selectedNode?.type === "row" && sel.row && (
                            <InspectorSection title="Row Spacing">
                                <FormGroup>
                                    <Label>Padding Top</Label>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                        <input type="range" min={0} max={100} value={sel.row.settings.paddingTop || 0} onChange={e => updateRowSetting(sel.row!.id, "paddingTop", +e.target.value)} style={{ flex: 1, accentColor: "#6366F1" }} />
                                        <span style={{ fontSize: 13, fontWeight: 500, color: "#334155", width: 40, textAlign: "right" }}>{sel.row.settings.paddingTop || 0}px</span>
                                    </div>
                                </FormGroup>
                                <FormGroup>
                                    <Label>Padding Bottom</Label>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                        <input type="range" min={0} max={100} value={sel.row.settings.paddingBottom || 0} onChange={e => updateRowSetting(sel.row!.id, "paddingBottom", +e.target.value)} style={{ flex: 1, accentColor: "#6366F1" }} />
                                        <span style={{ fontSize: 13, fontWeight: 500, color: "#334155", width: 40, textAlign: "right" }}>{sel.row.settings.paddingBottom || 0}px</span>
                                    </div>
                                </FormGroup>
                            </InspectorSection>
                        )}

                        {inspectorTab === "settings" && (
                            <InspectorSection title="Theme Preferences">
                                <FormGroup>
                                    <Label>Canvas Background</Label>
                                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                        <div style={{ position: "relative", width: 36, height: 36, borderRadius: 8, overflow: "hidden", border: "1px solid #E2E8F0", flexShrink: 0 }}>
                                            <input type="color" value={design.theme.background} onChange={e => pushDesign(d => { d.theme.background = e.target.value; return d; })} style={{ position: "absolute", top: -8, left: -8, width: 56, height: 56, cursor: "pointer" }} />
                                        </div>
                                        <input value={design.theme.background} onChange={e => pushDesign(d => { d.theme.background = e.target.value; return d; })} style={{ ...inputStyle, marginBottom: 0 }} />
                                    </div>
                                </FormGroup>
                                <FormGroup>
                                    <Label>Primary Brand Color</Label>
                                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                        <div style={{ position: "relative", width: 36, height: 36, borderRadius: 8, overflow: "hidden", border: "1px solid #E2E8F0", flexShrink: 0 }}>
                                            <input type="color" value={design.theme.primaryColor} onChange={e => pushDesign(d => { d.theme.primaryColor = e.target.value; return d; })} style={{ position: "absolute", top: -8, left: -8, width: 56, height: 56, cursor: "pointer" }} />
                                        </div>
                                        <input value={design.theme.primaryColor} onChange={e => pushDesign(d => { d.theme.primaryColor = e.target.value; return d; })} style={{ ...inputStyle, marginBottom: 0 }} />
                                    </div>
                                </FormGroup>
                                <FormGroup>
                                    <Label>Typography Base</Label>
                                    <select value={design.theme.fontFamily} onChange={e => pushDesign(d => { d.theme.fontFamily = e.target.value; return d; })} style={inputStyle}>
                                        <option value="'Inter', Arial, sans-serif">Inter (Modern Sans)</option>
                                        <option value="'Georgia', serif">Georgia (Classic Serif)</option>
                                        <option value="'Helvetica Neue', Helvetica, Arial, sans-serif">Helvetica (Clean)</option>
                                        <option value="'Courier New', Courier, monospace">Courier (Monospace)</option>
                                    </select>
                                </FormGroup>
                            </InspectorSection>
                        )}
                    </div>
                </div>
            </div>

            {/* ════ PREVIEW MODAL ════ */}
            {showPreview && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowPreview(false)}>
                    <div onClick={e => e.stopPropagation()} style={{ width: 680, maxHeight: "90vh", background: "#fff", borderRadius: 24, overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}>
                        <div style={{ padding: "20px 24px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 15, fontWeight: 600, color: "#0F172A" }}>Live Email Render</span>
                            <button onClick={() => setShowPreview(false)} style={{ border: "1px solid #E2E8F0", background: "#fff", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#475569", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>Close Preview</button>
                        </div>
                        <iframe srcDoc={compiledHtml} style={{ width: "100%", height: "70vh", border: "none" }} title="Preview" />
                    </div>
                </div>
            )}

            <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        * { box-sizing: border-box; }
        .block-card:hover { background-color: #F8FAFC !important; transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -4px rgba(0,0,0,0.05) !important; border-color: #E2E8F0 !important; }
        .row-card:hover { background-color: #F8FAFC !important; transform: translateY(-1px); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05) !important; border-color: #E2E8F0 !important; }
      `}</style>
        </div>
    );
}

// ── HELPER COMPONENTS ──────────────────────────────────────────────────────
const iconBtn: React.CSSProperties = { width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", border: "none", borderRadius: 10, background: "none", cursor: "pointer", transition: "all 0.15s ease" };

function SectionLabel({ children }: { children: React.ReactNode }) {
    return <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>{children}</div>;
}

function InspectorSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 20, paddingBottom: 12, borderBottom: "1px solid #E2E8F0" }}>{title}</div>
            {children}
        </div>
    );
}

function FormGroup({ children }: { children: React.ReactNode }) {
    return <div style={{ marginBottom: 24 }}>{children}</div>;
}

function Label({ children }: { children: React.ReactNode }) {
    return <div style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 8 }}>{children}</div>;
}

const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #E2E8F0",
    background: "#F8FAFC", color: "#0F172A", fontSize: 13, outline: "none",
    transition: "all 0.15s ease", boxSizing: "border-box", fontWeight: 500,
};
