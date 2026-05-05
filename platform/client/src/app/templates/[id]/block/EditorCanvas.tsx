"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
    AlignLeft, AlignCenter, AlignRight, Copy, Trash2, 
    Bold, Italic, Underline, Type, Palette, Plus, Minus,
    LineChart, MoreHorizontal, Link, GripVertical, Move, Settings2, X,
    FlipHorizontal, FlipVertical, Image as ImageIcon, Sparkles, SlidersHorizontal,
    List, ListOrdered, Wand2, Paintbrush, Eraser, ChevronDown
} from "lucide-react";
import { DesignJSON, DesignBlock, SelectedNode, BlockType, BrandTypography } from "./types";
import { useEditorStore } from "@/store/useEditorStore";
import { SelectionOverlay } from "./components/SelectionOverlay";
import { ImageFabricBlock } from "./components/ImageFabricBlock";
import { TextFabricBlock } from "./components/TextFabricBlock";

// ── COMPONENTS ─────────────────────────────────────────────────────────────

function StableText({ content, onBlur, style, isSelected, linkUrl, onKeyUp, onDoubleClick }: { 
    content: string; onBlur: (e: any) => void; style: React.CSSProperties; isSelected: boolean; 
    linkUrl?: string; onKeyUp?: (e: any) => void; onDoubleClick?: (e: any) => void;
}) {
    const ref = useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        // Only sync innerHTML when not focused (prevents cursor jump during typing)
        if (ref.current && document.activeElement !== ref.current) {
            ref.current.innerHTML = content;
        }
    }, [content]);

    // Auto-focus on single click (when block becomes selected)
    React.useEffect(() => {
        if (isSelected && ref.current) {
            ref.current.focus();
            // Place cursor at end
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(ref.current);
            range.collapse(false);
            sel?.removeAllRanges();
            sel?.addRange(range);
        }
    }, [isSelected]);

    return (
        <div
            ref={ref}
            contentEditable={isSelected}
            suppressContentEditableWarning
            onBlur={onBlur}
            onKeyUp={onKeyUp}
            onDoubleClick={onDoubleClick}
            style={{ 
                ...style, 
                outline: "none",
                cursor: isSelected ? "text" : (linkUrl ? "pointer" : "default")
            }}
        />
    );
}

function FloatingToolbar({ block, onUpdate, position, onDuplicate, onDelete }: { 
    block: DesignBlock; onUpdate: (key: string, val: any) => void; position: { top: number; left: number; bottom: number };
    onDuplicate: () => void; onDelete: () => void;
}) {
    const isText = block.type === "text" || block.type === "hero" || block.type === "footer" || block.type === "layout" || block.type === "floating-text";
    const currentFontSize = block.props.fontSize || 16;
    const toolbarRef = useRef<HTMLDivElement>(null);
    const [adjustedPos, setAdjustedPos] = useState({ top: -1000, left: -1000, opacity: 0 });
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        if (!position) return;
        
        const width = toolbarRef.current?.offsetWidth || 500;
        let top = position.top - 75;
        let left = position.left;

        // Flip to bottom if near top bar
        if (top < 100) {
            top = position.bottom + 20;
        }

        // Horizontal boundaries (stay between sidebars)
        const leftSidebarWidth = 360; // 72 + 280 roughly
        const rightSidebarWidth = 300;
        const padding = 20;
        
        const minLeft = leftSidebarWidth + width/2 + padding;
        const maxLeft = window.innerWidth - rightSidebarWidth - width/2 - padding;
        
        left = Math.max(minLeft, Math.min(maxLeft, left));

        setAdjustedPos({ top, left, opacity: 1 });
    }, [position]);

    const btnStyle: React.CSSProperties = {
        padding: "8px", borderRadius: "8px", background: "transparent", border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
    };

    const EMAIL_FONTS = [
        "Arial", "Georgia", "Trebuchet MS", "Verdana",
        "Tahoma", "Times New Roman", "Courier New", "Impact"
    ];

    const exec = (command: string, value?: string) => {
        document.execCommand(command, false, value);
    };

    return (
        <div 
            ref={toolbarRef}
            style={{
                position: "fixed", top: adjustedPos.top, left: adjustedPos.left,
                transform: "translateX(-50%)",
                background: "rgba(255, 255, 255, 0.98)", backdropFilter: "blur(20px)",
                padding: "6px 12px", borderRadius: "16px", display: "flex", alignItems: "center", gap: "8px",
                boxShadow: "0 20px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)",
                zIndex: 3000, border: "1px solid rgba(255, 255, 255, 0.3)",
                opacity: adjustedPos.opacity,
                transition: "top 0.2s cubic-bezier(0.16, 1, 0.3, 1), left 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s",
                pointerEvents: "auto"
            }}>
            <style>{`
                @keyframes toolbarFadeIn { from { opacity: 0; transform: translateX(-50%) translateY(4px) scale(0.98); } to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); } }
                * { box-sizing: border-box; }
                .toolbar-btn { 
                    padding: 8px; border-radius: 10px; background: transparent; border: none; cursor: pointer;
                    display: flex; align-items: center; justify-content: center; color: #475569;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .toolbar-btn:hover { background: #F8FAFC !important; color: #6366F1 !important; transform: translateY(-1px); }
                .toolbar-btn.active { background: #EEF2FF !important; color: #6366F1 !important; }
                .settings-popover {
                    position: absolute; bottom: calc(100% + 12px); left: 50%; transform: translateX(-50%);
                    background: white; border-radius: 16px; padding: 16px; width: 260px;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
                    border: 1px solid #E2E8F0; z-index: 3001; animation: popIn 0.2s ease-out;
                }
                @keyframes popIn { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
                .popover-input {
                    width: 100%; padding: 8px 12px; border: 1px solid #E2E8F0; border-radius: 8px;
                    font-size: 13px; margin-top: 4px; outline: none; transition: border-color 0.2s;
                }
                .popover-input:focus { border-color: #6366F1; }
            `}</style>

            {showSettings && (
                <div className="settings-popover">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#1E293B" }}>Settings</span>
                        <X size={14} style={{ cursor: "pointer" }} onClick={() => setShowSettings(false)} />
                    </div>
                    {block.type === "image" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Image URL</label>
                                <input className="popover-input" value={block.props.src || ""} onChange={e => onUpdate("src", e.target.value)} placeholder="https://..." />
                            </div>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Alt Text</label>
                                <input className="popover-input" value={block.props.alt || ""} onChange={e => onUpdate("alt", e.target.value)} placeholder="Describe image..." />
                            </div>
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Corner Radius</label>
                                    <span style={{ fontSize: 11, color: "#64748B" }}>{block.props.borderRadius || 0}px</span>
                                </div>
                                <input type="range" min="0" max="100" style={{ width: "100%", marginTop: 4 }} value={block.props.borderRadius || 0} onChange={e => onUpdate("borderRadius", parseInt(e.target.value))} />
                            </div>
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Opacity</label>
                                    <span style={{ fontSize: 11, color: "#64748B" }}>{Math.round((block.props.opacity ?? 1) * 100)}%</span>
                                </div>
                                <input type="range" min="0" max="1" step="0.01" style={{ width: "100%", marginTop: 4 }} value={block.props.opacity ?? 1} onChange={e => onUpdate("opacity", parseFloat(e.target.value))} />
                            </div>
                        </div>
                    )}
                    {(block.type === "button" || block.type === "image" || block.type === "text") && (
                        <div style={{ marginTop: block.type === "image" ? 10 : 0 }}>
                            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Link URL</label>
                            <input className="popover-input" value={block.props.linkUrl || ""} onChange={e => onUpdate("linkUrl", e.target.value)} placeholder="https://..." />
                        </div>
                    )}
                </div>
            )}
            
            <div style={{ cursor: "grab", padding: "4px", color: "#CBD5E1" }}><GripVertical size={14} /></div>
            <div style={{ width: 1, height: 20, background: "#E2E8F0", margin: "0 2px" }} />

            <button className={`toolbar-btn ${showSettings ? "active" : ""}`} onClick={() => setShowSettings(!showSettings)}>
                <Settings2 size={16} />
            </button>
            <div style={{ width: 1, height: 20, background: "#E2E8F0", margin: "0 2px" }} />

            {isText && (
                <>
                    <button className="toolbar-btn" style={{ width: "auto", padding: "0 8px", gap: 6, color: "#6366F1", fontWeight: 700, fontSize: 13 }}>
                        <Wand2 size={14} /> Magic Write
                    </button>
                    <div style={{ width: 1, height: 20, background: "#E2E8F0", margin: "0 4px" }} />

                    {/* Font Family Dropdown */}
                    <select
                        value={block.props.fontFamily || "Arial"}
                        onChange={e => onUpdate("fontFamily", e.target.value)}
                        style={{
                            height: 28, padding: "0 6px", border: "1px solid #E2E8F0", borderRadius: 6,
                            fontSize: 12, fontWeight: 600, color: "#334155", cursor: "pointer",
                            background: "#fff", outline: "none", maxWidth: 110
                        }}
                    >
                        {EMAIL_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>

                    {/* Font Size Stepper */}
                    <div style={{ display: "flex", alignItems: "center", gap: 2, background: "#F1F5F9", borderRadius: 8, padding: "2px" }}>
                        <button
                            className="toolbar-btn"
                            onMouseDown={e => { e.preventDefault(); onUpdate("fontSize", Math.max(8, currentFontSize - 2)); }}
                            style={{ width: 24, height: 24 }}
                        ><Minus size={14} /></button>
                        <span style={{ fontSize: 12, fontWeight: 700, minWidth: 24, textAlign: "center" }}>{currentFontSize}</span>
                        <button
                            className="toolbar-btn"
                            onMouseDown={e => { e.preventDefault(); onUpdate("fontSize", Math.min(96, currentFontSize + 2)); }}
                            style={{ width: 24, height: 24 }}
                        ><Plus size={14} /></button>
                    </div>

                    <div style={{ width: 1, height: 20, background: "#E2E8F0", margin: "0 4px" }} />

                    <button className="toolbar-btn" onMouseDown={(e) => { e.preventDefault(); exec("bold"); }}><Bold size={16} /></button>
                    <button className="toolbar-btn" onMouseDown={(e) => { e.preventDefault(); exec("italic"); }}><Italic size={16} /></button>
                    <button className="toolbar-btn" onMouseDown={(e) => { e.preventDefault(); exec("underline"); }}><Underline size={16} /></button>

                    <button 
                        className="toolbar-btn" 
                        style={{ position: "relative" }}
                        onMouseDown={(e) => { e.preventDefault(); }}
                        onClick={() => {
                            const input = document.createElement("input");
                            input.type = "color";
                            input.value = block.props.color || "#000000";
                            input.oninput = (ev: any) => {
                                onUpdate("color", ev.target.value);
                            };
                            input.click();
                        }}
                    >
                        <Type size={16} />
                        <div style={{ position: "absolute", bottom: 4, width: 12, height: 2, background: block.props.color || "#000" }} />
                    </button>

                    <div style={{ width: 1, height: 20, background: "#E2E8F0", margin: "0 4px" }} />
                </>
            )}

            <div style={{ display: "flex", gap: 2 }}>
                {["left", "center", "right"].map((a) => (
                    <button key={a} onClick={() => onUpdate("align", a)}
                        className="toolbar-btn"
                        style={{ background: block.props.align === a ? "#EEF2FF" : "transparent", color: block.props.align === a ? "#6366F1" : "#94A3B8" }}>
                        {a === "left" && <AlignLeft size={16} />}
                        {a === "center" && <AlignCenter size={16} />}
                        {a === "right" && <AlignRight size={16} />}
                    </button>
                ))}
            </div>

            {block.type === "image" && (
                <>
                    <div style={{ width: 1, height: 20, background: "#E2E8F0", margin: "0 2px" }} />
                    <button className="toolbar-btn" onClick={() => onUpdate("flipH", !block.props.flipH)} title="Flip Horizontal" style={{ color: block.props.flipH ? "#6366F1" : "#475569" }}>
                        <FlipHorizontal size={16} />
                    </button>
                    <button className="toolbar-btn" onClick={() => onUpdate("flipV", !block.props.flipV)} title="Flip Vertical" style={{ color: block.props.flipV ? "#6366F1" : "#475569" }}>
                        <FlipVertical size={16} />
                    </button>
                    <button className="toolbar-btn" title="Replace Image" onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.onchange = (e: any) => {
                            const file = e.target.files[0];
                            if (file) {
                                // For now, we'll just log or set a placeholder.
                                // In a real app, this would upload to S3/Supabase.
                                const reader = new FileReader();
                                reader.onload = (rev: any) => onUpdate("src", rev.target.result);
                                reader.readAsDataURL(file);
                            }
                        };
                        input.click();
                    }}>
                        <ImageIcon size={16} />
                    </button>
                </>
            )}

            {isText && (
                <>
                    <button className="toolbar-btn" onMouseDown={(e) => { e.preventDefault(); exec("insertUnorderedList"); }}><List size={16} /></button>
                    <button 
                        className="toolbar-btn"
                        onMouseDown={(e) => { 
                            e.preventDefault(); 
                            const url = window.prompt("Enter URL:", "https://");
                            if (url) exec("createLink", url);
                        }} 
                        title="Add Link"
                    >
                        <Link size={16} />
                    </button>

                    <div style={{ width: 1, height: 20, background: "#E2E8F0", margin: "0 4px" }} />
                    <button className="toolbar-btn"><Paintbrush size={16} /></button>
                    <button className="toolbar-btn" onMouseDown={(e) => { e.preventDefault(); exec("removeFormat"); }}><Eraser size={16} /></button>
                </>
            )}

            <div style={{ width: 1, height: 20, background: "#E2E8F0", margin: "0 4px" }} />
            <button className="toolbar-btn" onClick={onDuplicate} title="Duplicate"><Copy size={16} /></button>
            <button className="toolbar-btn" onClick={onDelete} style={{ color: "#F87171" }} title="Delete"><Trash2 size={16} /></button>
        </div>
    );
}

// ── EDITABLE BLOCK RENDERER ────────────────────────────────────────────────
export function EditableBlock({
    block, isSelected, isHovered, onSelect, onHover, onLeave, onUpdate, onBulkUpdate, onDuplicate, onDelete, zone, index, design, viewMode, draggedBlockId, setDropIndicator, brandTypography
}: {
    block: DesignBlock; isSelected: boolean; isHovered: boolean;
    onSelect: () => void; onHover: () => void; onLeave: () => void;
    onUpdate: (key: string, val: any) => void;
    onBulkUpdate: (updates: Record<string, any>, newType?: BlockType) => void;
    onDuplicate: () => void; onDelete: () => void;
    zone: string; index: number; design: DesignJSON; viewMode: "desktop" | "mobile";
    draggedBlockId: React.MutableRefObject<{ id: string, zone: string } | null>;
    setDropIndicator: (val: { zone: string, index: number, y: number } | null) => void;
    brandTypography?: BrandTypography;
}) {
    const blockRef = useRef<HTMLDivElement>(null);
    const { validationErrors } = useEditorStore();
    const p = block.props;
    
    const [isResizingTop, setIsResizingTop] = useState(false);
    const [isResizingBottom, setIsResizingBottom] = useState(false);
    const [isResizingLeft, setIsResizingLeft] = useState(false);
    const [isResizingRight, setIsResizingRight] = useState(false);
    const startY = useRef(0);
    const startX = useRef(0);
    const startSize = useRef({ width: 0, height: 0, paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0 });
    const [activeResizeProps, setActiveResizeProps] = useState<Record<string, any> | null>(null);
    const [toolbarPos, setToolbarPos] = useState<{ top: number; left: number; bottom: number } | null>(null);

    const getDefPadding = (key: string) => {
        if (p[key] !== undefined) return p[key];
        if (block.type === "hero") {
            if (key === "paddingTop" || key === "paddingBottom") return 40;
            return 24;
        }
        if (key === "paddingTop" || key === "paddingBottom") return 12;
        return 0;
    };

    // Resizing logic
    useEffect(() => {
        if (!(isResizingTop || isResizingBottom || isResizingLeft || isResizingRight)) return;

        const getUpdates = (ex: number, ey: number) => {
            const dy = ey - startY.current;
            const dx = ex - startX.current;
            const up: Record<string, any> = {};
            const contentWidth = design.theme.contentWidth || 600;

            // VERTICAL RESIZING (Top / Bottom)
            if (isResizingTop) {
                up.paddingTop = Math.max(0, startSize.current.paddingTop - dy);
            }
            if (isResizingBottom) {
                if (["image", "shape", "spacer"].includes(block.type)) {
                    up.height = Math.max(10, startSize.current.height + dy);
                } else {
                    up.paddingBottom = Math.max(0, startSize.current.paddingBottom + dy);
                }
            }

            // HORIZONTAL RESIZING (Left / Right)
            if (isResizingLeft) {
                up.paddingLeft = Math.max(0, startSize.current.paddingLeft - dx);
            }
            if (isResizingRight) {
                const newWidth = Math.max(10, startSize.current.width + dx);
                // For most blocks, resizing the right side should update the 'width' property
                if (["image", "shape", "text", "button", "floating-text"].includes(block.type)) {
                    const isPct = block.props.width?.toString().includes("%") || (!block.props.width && block.type !== "button");
                    up.width = isPct ? `${Math.min(100, Math.round((newWidth / contentWidth) * 100))}%` : newWidth;
                } else {
                    up.paddingRight = Math.max(0, startSize.current.paddingRight + dx);
                }
            }
            return up;
        };

        const handleMouseMove = (e: MouseEvent) => {
            setActiveResizeProps(getUpdates(e.clientX, e.clientY));
        };

        const handleMouseUp = (e: MouseEvent) => { 
            const finalUpdates = getUpdates(e.clientX, e.clientY);
            if (Object.keys(finalUpdates).length > 0) {
                onBulkUpdate(finalUpdates);
            }
            setIsResizingTop(false); setIsResizingBottom(false); 
            setIsResizingLeft(false); setIsResizingRight(false);
            setActiveResizeProps(null);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => { 
            window.removeEventListener("mousemove", handleMouseMove); 
            window.removeEventListener("mouseup", handleMouseUp); 
        };
    }, [isResizingTop, isResizingBottom, isResizingLeft, isResizingRight, onBulkUpdate, block.type, block.props.width, design.theme.contentWidth]);

    useEffect(() => {
        const updatePos = () => {
            if (isSelected && blockRef.current) {
                const rect = blockRef.current.getBoundingClientRect();
                setToolbarPos({ 
                    top: rect.top, 
                    left: rect.left + rect.width / 2,
                    bottom: rect.bottom
                });
            }
        };
        updatePos();
        window.addEventListener("canvas-scroll", updatePos);
        window.addEventListener("scroll", updatePos, true);
        window.addEventListener("resize", updatePos);
        return () => { 
            window.removeEventListener("canvas-scroll", updatePos); 
            window.removeEventListener("scroll", updatePos, true);
            window.removeEventListener("resize", updatePos); 
        };
    }, [isSelected, block.props, activeResizeProps]);

    const renderBlockContent = () => {
        const scale = (viewMode === "mobile" && brandTypography) ? brandTypography.mobileScale : 1;
        const getFontSize = (size: number) => Math.round(size * scale);
        // Merge active resize props for live preview
        const p = { ...block.props, ...activeResizeProps };

        switch (block.type) {
            case "floating-text":
                return (
                    <TextFabricBlock 
                        block={block} 
                        isSelected={isSelected} 
                        onUpdate={onUpdate} 
                    />
                );
            case "text":
                return (
                    <StableText 
                        isSelected={isSelected} content={p.content || ""} 
                        onBlur={(e) => onUpdate("content", e.currentTarget.innerHTML)}
                        style={{ 
                            fontSize: getFontSize(p.fontSize || 16),
                            color: p.color || design.theme.paragraphColor || "#475569",
                            textAlign: (p.align as any) || "left",
                            lineHeight: p.lineHeight || 1.6,
                            fontFamily: p.fontFamily || design.theme.fontFamily || "Arial",
                            fontWeight: p.fontWeight || "normal",
                            letterSpacing: p.letterSpacing ? `${p.letterSpacing}px` : undefined,
                        }}
                    />
                );
            case "image":
            case "floating-image":
                return (
                    <ImageFabricBlock 
                        block={block} 
                        isSelected={isSelected} 
                        onUpdate={onUpdate} 
                    />
                );
            case "button":
                return (
                    <div style={{
                        display: "inline-block",
                        padding: `${p.paddingV || 14}px ${p.paddingH || 28}px`,
                        background: p.backgroundColor || "#6366F1",
                        color: p.color || "#fff",
                        borderRadius: p.borderRadius ?? 8,
                        fontWeight: p.fontWeight || 600,
                        fontFamily: p.fontFamily || "Arial",
                        fontSize: p.fontSize || 16,
                        cursor: "pointer",
                        letterSpacing: p.letterSpacing ? `${p.letterSpacing}px` : undefined,
                    }}>{p.text || "Button"}</div>
                );
            case "divider":
                return <div style={{ borderTop: `1px solid ${p.color || "#E5E7EB"}` }} />;
            case "spacer":
                return <div style={{ height: p.height || 32 }} />;
            case "hero":
                return (
                    <div style={{ textAlign: "center" }}>
                        {p.logoUrl && (
                            <img src={p.logoUrl} onError={(e) => e.currentTarget.style.display = "none"} 
                                style={{ maxHeight: 50, marginBottom: 20, maxWidth: "100%", objectFit: "contain" }} 
                            />
                        )}
                        <StableText isSelected={isSelected} content={p.headline || "Headline"} onBlur={(e) => onUpdate("headline", e.currentTarget.innerHTML)} style={{ fontSize: getFontSize(p.fontSize || 24), color: "#fff", fontWeight: 700 }} />
                        <StableText isSelected={isSelected} content={p.subheadline || "Subheadline"} onBlur={(e) => onUpdate("subheadline", e.currentTarget.innerHTML)} style={{ fontSize: 15, color: "rgba(255,255,255,0.8)" }} />
                    </div>
                );
            case "footer":
                return (
                    <div style={{ textAlign: (p.align as any) || "center" }}>
                        {p.logoUrl && <img src={p.logoUrl} style={{ maxHeight: 30, marginBottom: 16 }} />}
                        <StableText isSelected={isSelected} content={p.content || "© Company"} onBlur={(e) => onUpdate("content", e.currentTarget.innerHTML)} style={{ fontSize: 12, color: "#9CA3AF" }} />
                    </div>
                );
            case "layout":
                const cols = p.layoutType === "3-col" ? 3 : (p.layoutType === "1-col" ? 1 : 2);
                return (
                    <div style={{ display: "flex", gap: 20 }}>
                        {Array.from({ length: cols }).map((_, i) => (
                            <div key={i} style={{ flex: 1, minHeight: 40, border: "1px dashed rgba(0,0,0,0.1)", borderRadius: 8, padding: 8 }}>
                                <StableText isSelected={isSelected} content={p.columns?.[i]?.content || "Text..."} onBlur={(e) => {
                                    const newCols = [...(p.columns || [])];
                                    newCols[i] = { content: e.currentTarget.innerHTML };
                                    onUpdate("columns", newCols);
                                }} style={{ fontSize: 14 }} />
                            </div>
                        ))}
                    </div>
                );
            case "shape":
                return (
                    <div style={{
                        display: "inline-block",
                        width: p.width || 100,
                        height: p.height || 100,
                        background: p.backgroundColor || "#8B3DFF",
                        borderRadius: p.borderRadius || 0,
                        border: p.border || "none"
                    }} />
                );
            case "line":
                return <div style={{ borderTop: "2px solid #475569" }} />;
            default:
                return <div>Unknown: {block.type}</div>;
        }
    };

    const [canDrag, setCanDrag] = useState(false);

    return (
        <div
            draggable={canDrag && !isResizingTop && !isResizingBottom && !isResizingLeft && !isResizingRight}
            onDragStart={(e) => {
                if (zone === "header") e.dataTransfer.setData("x-restriction/headers", "true");
                if (zone === "footer") e.dataTransfer.setData("x-restriction/footers", "true");
                e.dataTransfer.setData("moveBlock", JSON.stringify({ blockId: block.id, sourceZone: zone }));
                draggedBlockId.current = { id: block.id, zone }; 
            }}
            onDragEnd={() => { draggedBlockId.current = null; setDropIndicator(null); setCanDrag(false); }}
            style={{ 
                marginBottom: 4, 
                width: "100%", 
                display: "flex", 
                justifyContent: p.align === "center" ? "center" : (p.align === "right" ? "flex-end" : "flex-start"), 
                position: "relative" 
            }}
        >
            <div
                id={block.id}
                ref={blockRef}
                onClick={(e) => { e.stopPropagation(); onSelect(); }}
                onMouseEnter={onHover}
                onMouseLeave={onLeave}
                style={{
                    position: "relative",
                    width: p.width || (["button", "floating-text", "divider"].includes(block.type) ? "auto" : "100%"),
                    height: p.height || "auto",
                    maxWidth: "100%",
                    display: "inline-block",
                    background: p.backgroundColor || p.bgColor || "transparent",
                    borderRadius: p.borderRadius || 0,
                    paddingTop: (activeResizeProps?.paddingTop ?? getDefPadding("paddingTop")),
                    paddingBottom: (activeResizeProps?.paddingBottom ?? getDefPadding("paddingBottom")),
                    paddingLeft: (activeResizeProps?.paddingLeft ?? getDefPadding("paddingLeft")),
                    paddingRight: (activeResizeProps?.paddingRight ?? getDefPadding("paddingRight")),
                    cursor: "default",
                    transition: "box-shadow 0.2s, border 0.2s",
                    border: isHovered && !isSelected ? "1px solid #7D2AE8" : "1px solid transparent",
                    boxShadow: validationErrors[block.id] ? "0 0 0 2px #EF4444, 0 0 12px rgba(239, 68, 68, 0.4)" : "none",
                    boxSizing: "border-box",
                    zIndex: isSelected ? 10 : 1,
                    overflow: p.borderRadius ? "hidden" : "visible" 
                }}
            >
                {isSelected && (
                    <>
                        <div onMouseDown={(e) => { 
                            e.preventDefault();
                            e.stopPropagation(); 
                            setIsResizingTop(true); 
                            startY.current = e.clientY; 
                            startSize.current = { 
                                paddingTop: getDefPadding("paddingTop"),
                                paddingBottom: getDefPadding("paddingBottom"),
                                paddingLeft: getDefPadding("paddingLeft"),
                                paddingRight: getDefPadding("paddingRight"),
                                width: blockRef.current?.offsetWidth || 0,
                                height: blockRef.current?.offsetHeight || 0
                            };
                        }}
                            style={{ position: "absolute", top: -10, left: 0, right: 0, height: 20, cursor: "ns-resize", zIndex: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <div className="resize-pill" style={{ width: 40, height: 4, background: "#6366F1", borderRadius: 4, opacity: 0.8 }} />
                        </div>
                        <div onMouseDown={(e) => { 
                            e.preventDefault();
                            e.stopPropagation(); 
                            setIsResizingBottom(true); 
                            startY.current = e.clientY; 
                            startSize.current = { 
                                paddingTop: getDefPadding("paddingTop"),
                                paddingBottom: getDefPadding("paddingBottom"),
                                paddingLeft: getDefPadding("paddingLeft"),
                                paddingRight: getDefPadding("paddingRight"),
                                width: blockRef.current?.offsetWidth || 0,
                                height: blockRef.current?.offsetHeight || (p.height || 0)
                            };
                        }}
                            style={{ position: "absolute", bottom: -10, left: 0, right: 0, height: 20, cursor: "ns-resize", zIndex: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <div className="resize-pill" style={{ width: 40, height: 4, background: "#6366F1", borderRadius: 4, opacity: 0.8 }} />
                        </div>
                        <div onMouseDown={(e) => { 
                            e.preventDefault();
                            e.stopPropagation(); 
                            setIsResizingLeft(true); 
                            startX.current = e.clientX; 
                            startSize.current = { 
                                paddingTop: getDefPadding("paddingTop"),
                                paddingBottom: getDefPadding("paddingBottom"),
                                paddingLeft: getDefPadding("paddingLeft"),
                                paddingRight: getDefPadding("paddingRight"),
                                width: blockRef.current?.offsetWidth || 0,
                                height: blockRef.current?.offsetHeight || 0
                            };
                        }}
                            style={{ position: "absolute", left: -10, top: 0, bottom: 0, width: 20, cursor: "ew-resize", zIndex: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <div className="resize-pill" style={{ width: 4, height: 40, background: "#6366F1", borderRadius: 4, opacity: 0.8 }} />
                        </div>
                        <div onMouseDown={(e) => { 
                            e.preventDefault();
                            e.stopPropagation(); 
                            setIsResizingRight(true); 
                            startX.current = e.clientX; 
                            startSize.current = { 
                                paddingTop: getDefPadding("paddingTop"),
                                paddingBottom: getDefPadding("paddingBottom"),
                                paddingLeft: getDefPadding("paddingLeft"),
                                paddingRight: getDefPadding("paddingRight"),
                                width: blockRef.current?.offsetWidth || (p.width && !p.width.toString().includes("%") ? parseInt(p.width) : blockRef.current?.offsetWidth || 0),
                                height: blockRef.current?.offsetHeight || 0
                            };
                        }}
                            style={{ position: "absolute", right: -10, top: 0, bottom: 0, width: 20, cursor: "ew-resize", zIndex: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <div className="resize-pill" style={{ width: 4, height: 40, background: "#6366F1", borderRadius: 4, opacity: 0.8 }} />
                        </div>

                        {/* PREMIUM MOVE HANDLE */}
                        <div 
                            onMouseEnter={() => setCanDrag(true)}
                            onMouseLeave={() => setCanDrag(false)}
                            style={{
                                position: "absolute", bottom: -40, left: "50%", transform: "translateX(-50%)",
                                background: "#6366F1", color: "white", width: 32, height: 32, borderRadius: "50%",
                                display: "flex", alignItems: "center", justifyContent: "center", cursor: "grab",
                                boxShadow: "0 4px 10px rgba(99, 102, 241, 0.4)", zIndex: 150,
                                border: "2px solid #fff"
                            }}
                            title="Drag to move"
                        >
                            <Move size={16} />
                        </div>
                    </>
                )}
                {renderBlockContent()}
                {isSelected && toolbarPos && !isResizingTop && !isResizingBottom && !isResizingLeft && !isResizingRight && (
                    <FloatingToolbar block={block} onUpdate={onUpdate} position={toolbarPos} onDuplicate={onDuplicate} onDelete={onDelete} />
                )}
            </div>
        </div>
    );
}

// ── CANVAS COMPONENT ───────────────────────────────────────────────────────
export default function EditorCanvas({
    brandTypography
}: {
    brandTypography?: BrandTypography;
}) {
    const {
        design,
        selectedNode,
        hoveredBlockId,
        viewMode,
        validationErrors,
        selectNode,
        setHoveredBlockId,
        updateBlockProp,
        bulkUpdateBlock,
        addBlock,
        moveBlock,
        duplicateBlock,
        deleteBlock
    } = useEditorStore();

    const onSelectNode = selectNode;
    const onHoverBlock = setHoveredBlockId;
    const onLeaveBlock = () => setHoveredBlockId(null);
    const onUpdateBlockProp = updateBlockProp;
    const onBulkUpdateBlock = bulkUpdateBlock;
    const onAddBlockToZone = addBlock;
    const onMoveBlock = moveBlock;
    const onDuplicateBlock = duplicateBlock;
    const onDeleteBlock = deleteBlock;
    const hoveredBlock = hoveredBlockId;
    const [dropIndicator, setDropIndicator] = useState<{ zone: string, index: number, y: number } | null>(null);
    const draggedBlockId = useRef<{ id: string, zone: string } | null>(null);

    const renderZone = (zone: "header" | "body" | "footer", blocks: DesignBlock[]) => {
        const isEmpty = blocks.length === 0;
        return (
            <div data-zone={zone} style={{ 
                minHeight: zone === "body" ? 400 : 80, position: "relative",
                background: zone === "header" ? design.theme.headerBackground : zone === "footer" ? design.theme.footerBackground : design.theme.bodyBackground,
                padding: `${zone === "header" ? design.theme.headerPadding : (zone === "body" ? 40 : design.theme.footerPadding)}px 20px`,
            }}>
                <div style={{ position: "absolute", top: 12, left: 20, fontSize: 9, fontWeight: 800, color: "#94A3B8", opacity: 0.6 }}>{zone.toUpperCase()}</div>
                <div style={{ width: "100%", maxWidth: design.theme.contentWidth || 600, margin: "0 auto" }}>
                    {isEmpty && zone === "body" && (
                        <div style={{
                            height: 320, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                            border: "2px dashed #CBD5E1", borderRadius: 12, color: "#94A3B8", gap: 12,
                            pointerEvents: "none"
                        }}>
                            <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><rect x={3} y={3} width={18} height={18} rx={2}/><path d="M3 9h18M9 21V9"/></svg>
                            <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: 14, fontWeight: 600, color: "#64748B" }}>Drag elements here</div>
                                <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>or click an element in the sidebar to add it</div>
                            </div>
                        </div>
                    )}
                    {blocks.map((block, idx) => (
                        <React.Fragment key={block.id}>
                            {dropIndicator?.zone === zone && dropIndicator.index === idx && (
                                <div style={{ height: 6, background: "#6366F1", margin: "8px 0", borderRadius: 3, boxShadow: "0 0 10px rgba(99, 102, 241, 0.4)", animation: "pulse 1.5s infinite" }} />
                            )}
                            <EditableBlock
                                block={block} isSelected={selectedNode?.id === block.id} isHovered={hoveredBlock === block.id}
                                onSelect={() => onSelectNode({ id: block.id, type: "block" })} onHover={() => onHoverBlock(block.id)} onLeave={onLeaveBlock}
                                onUpdate={(k, v) => onUpdateBlockProp(block.id, k, v)} 
                                onBulkUpdate={(u) => onBulkUpdateBlock(block.id, u)}
                                onDuplicate={() => onDuplicateBlock(block.id)} onDelete={() => onDeleteBlock(block.id)}
                                zone={zone} index={idx} design={design} viewMode={viewMode} draggedBlockId={draggedBlockId} setDropIndicator={setDropIndicator} brandTypography={brandTypography}
                            />
                        </React.Fragment>
                    ))}
                    {dropIndicator?.zone === zone && dropIndicator.index === blocks.length && (
                        <div style={{ height: 6, background: "#6366F1", margin: "8px 0", borderRadius: 3, boxShadow: "0 0 10px rgba(99, 102, 241, 0.4)", animation: "pulse 1.5s infinite" }} />
                    )}
                </div>
            </div>
        );
    };

    return (
        <div 
            id="editor-canvas-viewport"
            className="canvas-viewport"
            style={{ 
                flex: 1, 
                minHeight: 0, 
                overflowY: "auto", 
                background: "#F8F9FB", 
                display: "flex", 
                flexDirection: "column",
                alignItems: "center", 
                padding: "40px 80px",
                position: "relative",
                backgroundImage: `
                    linear-gradient(45deg, #f1f5f9 25%, transparent 25%),
                    linear-gradient(-45deg, #f1f5f9 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, #f1f5f9 75%),
                    linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)
                `,
                backgroundSize: "20px 20px",
                backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px"
            }} 
            onScroll={() => window.dispatchEvent(new CustomEvent("canvas-scroll"))}
            onClick={() => onSelectNode(null)}
        >
            <SelectionOverlay />
            <div 
                className="canvas-page"
                onClick={(e) => { e.stopPropagation(); onSelectNode({ type: "page", id: "main" }); }}
                style={{ 
                    width: viewMode === "mobile" ? 390 : (design.theme.contentWidth || 600),
                    minHeight: "100%",
                    background: design.theme.background || "#fff", 
                    boxShadow: "0 8px 32px rgba(0,0,0,0.06)", 
                    borderRadius: 12, 
                    overflow: "visible", // ALLOW HANDLES TO BE SEEN
                    position: "relative",
                    border: selectedNode?.type === "page" ? "2px solid #6366F1" : "2px solid transparent",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    cursor: "default",
                    marginBottom: 100, // Space at bottom
                    flexShrink: 0
                }}
                onDragOver={e => {
                    e.preventDefault();
                    const zoneNodes = Array.from(e.currentTarget.querySelectorAll('[data-zone]'));
                    let targetZone: any = "body";
                    for (const node of zoneNodes) {
                        const rect = node.getBoundingClientRect();
                        if (e.clientY >= rect.top && e.clientY <= rect.bottom) { targetZone = node.getAttribute('data-zone'); break; }
                    }
                    if (e.dataTransfer.types.includes("x-restriction/headers") && targetZone !== "header") { setDropIndicator(null); return; }
                    if (e.dataTransfer.types.includes("x-restriction/footers") && targetZone !== "footer") { setDropIndicator(null); return; }
                    
                    const targetNode = e.currentTarget.querySelector(`[data-zone="${targetZone}"]`);
                    if (targetNode) {
                        const others = Array.from(targetNode.querySelectorAll('[data-block-id]')).filter(n => n.getAttribute('data-block-id') !== draggedBlockId.current?.id);
                        let idx = others.length;
                        for (let i = 0; i < others.length; i++) {
                            const rect = others[i].getBoundingClientRect();
                            if (e.clientY < (rect.top + rect.bottom) / 2) { idx = i; break; }
                        }
                        setDropIndicator({ zone: targetZone, index: idx, y: 0 });
                    }
                }}
                onDrop={e => {
                    e.preventDefault();
                    const tz = dropIndicator?.zone || "body";
                    const idx = dropIndicator?.index;
                    const move = draggedBlockId.current;
                    setDropIndicator(null);
                    if (move) { onMoveBlock(move.id, move.zone, tz, idx); return; }
                    const bt = e.dataTransfer.getData("blockType");
                    const bp = e.dataTransfer.getData("blockProps");
                    if (bt) onAddBlockToZone(tz as any, bt as BlockType, bp ? JSON.parse(bp) : undefined, idx);
                }}
            >
                {renderZone("header", design.headerBlocks)}
                {renderZone("body", design.bodyBlocks)}
                {renderZone("footer", design.footerBlocks)}
            </div>
            <style>{`
                @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
                .resize-pill { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
                .resize-pill:hover { transform: scale(1.4); background: #4F46E5 !important; }
                .canvas-page:hover { border-color: rgba(99, 102, 241, 0.4) !important; }
            `}</style>
        </div>
    );
}
