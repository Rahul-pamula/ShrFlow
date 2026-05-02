"use client";

import React, { useState, useRef } from "react";
import { 
    GripVertical, Copy, Trash2, AlignLeft, AlignCenter, AlignRight, 
    Bold, Italic, Link as LinkIcon, Facebook, Instagram, Twitter, Linkedin,
    Youtube, MessageCircle
} from "lucide-react";
import { DesignJSON, DesignBlock, SelectedNode, BLOCK_DEFAULTS, BlockType, BrandTypography } from "./types";

// ── STABLE TEXT COMPONENT (Prevents React from overwriting typed content) ──
const StableText = React.memo(({ content, isSelected, style, onBlur, onDoubleClick, linkUrl }: any) => {
    const linkStyle = linkUrl ? { color: "#2563EB", textDecoration: "underline", cursor: "pointer" } : {};
    return (
        <div
            contentEditable={isSelected}
            suppressContentEditableWarning
            onBlur={onBlur}
            onDoubleClick={onDoubleClick}
            dangerouslySetInnerHTML={{ __html: content }}
            style={{ 
                ...style, ...linkStyle, 
                wordBreak: "break-word", 
                overflowWrap: "break-word",
                whiteSpace: "pre-wrap"
            }}
        />
    );
}, (prev, next) => {
    // Only re-render if selection state or link changes, 
    // BUT also re-render if content changes externally (e.g. via undo/redo)
    return prev.isSelected === next.isSelected && 
           prev.linkUrl === next.linkUrl && 
           prev.content === next.content;
});

// ── FLOATING TOOLBAR (for text editing) ────────────────────────────────────
function FloatingToolbar({ block, onUpdate, position, onDuplicate, onDelete, onAddLink }: { 
    block: DesignBlock; onUpdate: (key: string, val: any) => void; 
    position: { top: number; left: number };
    onDuplicate: () => void; onDelete: () => void;
    onAddLink: () => void;
}) {
    const cleanOpen = (url: string) => {
        const u = (url || "").trim().replace(/^#/, "");
        if (!u || u === "") return;
        console.log(`[EditorCanvas] Opening clean URL: ${u}`);
        window.open(u.startsWith("http") ? u : `https://${u}`, "_blank");
    };

    const isText = block.type === "text" || block.type === "floating-text";
    const isShapeOrLine = block.type === "shape" || block.type === "line";
    const isFloating = block.type === "floating-text";
    const isLine = block.type === "line";

    const fonts = ["Inter", "Arial", "Georgia", "Verdana", "Times New Roman"];
    const sizes = [12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56];

    const toolbarRef = React.useRef<HTMLDivElement>(null);

    React.useLayoutEffect(() => {
        if (!toolbarRef.current) return;
        const el = toolbarRef.current;
        const rect = el.getBoundingClientRect();
        const vw = window.innerWidth;
        const MARGIN = 8;
        
        let xOffset = 0;
        if (rect.right > vw - MARGIN) {
            xOffset = vw - MARGIN - rect.right;
        } else if (rect.left < MARGIN) {
            xOffset = MARGIN - rect.left;
        }
        
        if (xOffset !== 0) {
            el.style.left = `${position.left + xOffset}px`;
        } else {
            el.style.left = `${position.left}px`;
        }
    }, [position]);

    return (
        <div ref={toolbarRef} style={{
            position: "fixed", top: position.top, left: position.left, transform: "translate(-50%, -100%)", marginTop: -12, zIndex: 100,
            display: "flex", alignItems: "center", gap: 12, padding: "8px 16px", minHeight: 48,
            background: "#fff", borderRadius: 12, boxShadow: "0 12px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.04)",
            border: "1px solid rgba(0,0,0,0.05)", fontSize: 13,
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, animation: "fadeSlideUp 0.15s ease-out forwards" }}>

            {isText && (
                <>
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
                            { icon: <LinkIcon size={15} />, key: "link", active: false, action: onAddLink },
                        ].map((b, i) => (
                            <button key={i} onClick={b.action || (() => onUpdate(b.key, b.toggle))}
                                style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", border: "none", borderRadius: 8, cursor: "pointer", background: b.active ? "#EEF2FF" : "transparent", color: b.active ? "#6366F1" : "#64748B", transition: "all 0.1s" }}>
                                {b.icon}
                            </button>
                        ))}
                    </div>
                </>
            )}

            {block.type === "shape" && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 600, color: "#64748B", marginRight: 4 }}>Size:</span>
                    <button onClick={() => { onUpdate("width", (block.props.width || 100) - 10); onUpdate("height", (block.props.height || 100) - 10); }}
                        style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>-</button>
                    <span style={{ fontSize: 11, fontWeight: 700, width: 60, textAlign: "center" }}>{block.props.width}x{block.props.height}</span>
                    <button onClick={() => { onUpdate("width", (block.props.width || 100) + 10); onUpdate("height", (block.props.height || 100) + 10); }}
                        style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>+</button>
                </div>
            )}

            {isLine && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 600, color: "#64748B", marginRight: 4 }}>Thickness:</span>
                    <button onClick={() => onUpdate("thickness", Math.max(1, (block.props.thickness || 2) - 1))}
                        style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>-</button>
                    <span style={{ fontSize: 11, fontWeight: 700, width: 30, textAlign: "center" }}>{block.props.thickness}</span>
                    <button onClick={() => onUpdate("thickness", (block.props.thickness || 2) + 1)}
                        style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>+</button>
                </div>
            )}

            <div style={{ width: 1, height: 24, background: "#E5E7EB" }} />

            <div style={{ display: "flex", gap: 4, borderRight: (isShapeOrLine) ? "none" : "1px solid #E5E7EB", paddingRight: (isShapeOrLine) ? 0 : 8 }}>
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

            <div style={{ display: "flex", gap: 4, marginLeft: (isShapeOrLine) ? 0 : 8 }}>
                <button onClick={onDuplicate} title="Duplicate"
                    style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", border: "none", borderRadius: 8, cursor: "pointer", background: "transparent", color: "#64748B" }}>
                    <Copy size={15} />
                </button>
                <button onClick={onDelete} title="Delete"
                    style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", border: "none", borderRadius: 8, cursor: "pointer", background: "transparent", color: "#EF4444" }}>
                    <Trash2 size={15} />
                </button>
            </div>
            </div>
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
    zone: string; index: number;
    design: DesignJSON;
    viewMode: "desktop" | "mobile";
    draggedBlockId: React.MutableRefObject<{ id: string, zone: string } | null>;
    setDropIndicator: (val: { zone: string, index: number, y: number } | null) => void;
    brandTypography?: BrandTypography;
}) {
    const blockRef = useRef<HTMLDivElement>(null);
    const [localDragging, setLocalDragging] = useState(false);
    const [localDragPos, setLocalDragPos] = useState({ x: 0, y: 0 });
    const [startDragPos, setStartDragPos] = useState({ x: 0, y: 0 });
    const p = block.props;
    const toolbarRef = useRef<HTMLDivElement>(null);
    const [toolbarPos, setToolbarPos] = useState<{ top: number; left: number } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isDraggable, setIsDraggable] = useState(false);
    const [tmpPos, setTmpPos] = useState<{ x: number, y: number } | null>(null);
    const dragOffset = useRef({ x: 0, y: 0 });
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);

    const cleanOpen = (url: string) => {
        const u = (url || "").trim().replace(/^#/, "");
        if (!u || u === "") return;
        window.open(u.startsWith("http") ? u : `https://${u}`, "_blank");
    };

    const handleSelect = () => {
        onSelect();
        // The useEffect will handle positioning, but we can do an immediate one too
        if (blockRef.current) {
            const rect = blockRef.current.getBoundingClientRect();
            setToolbarPos({ top: rect.top, left: rect.left + rect.width / 2 });
        }
    };

    React.useEffect(() => {
        const updatePos = () => {
            if (isSelected && blockRef.current) {
                const rect = blockRef.current.getBoundingClientRect();
                setToolbarPos({ top: rect.top, left: rect.left + rect.width / 2 });
            }
        };
        updatePos();
        window.addEventListener("canvas-scroll", updatePos);
        window.addEventListener("resize", updatePos);
        return () => {
            window.removeEventListener("canvas-scroll", updatePos);
            window.removeEventListener("resize", updatePos);
        };
    }, [isSelected, block.props]);

    const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
        onUpdate("content", e.currentTarget.innerHTML);
    };

    const handleAddLink = () => {
        const url = window.prompt("Enter the URL:");
        if (url) {
            document.execCommand("createLink", false, url);
        }
    };

    const handleOpenLink = () => {
        const url = block.props.linkUrl;
        if (url && typeof window !== "undefined") {
            window.open(url.startsWith("http") ? url : `https://${url}`, "_blank");
        }
    };

    const startLongPress = () => {
        if (!block.props.linkUrl) return;
        longPressTimer.current = setTimeout(() => {
            handleOpenLink();
        }, 600); // 600ms for long press
    };

    const endLongPress = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    // ── DRAG LOGIC FOR FLOATING BLOCKS (OR PLUCKING STANDARD BLOCKS) ──
    const handleMouseDown = (e: React.MouseEvent, forceDrag = false) => {
        const isFloating = block.type === "floating-text" || block.type === "floating-image";
        const isStandard = block.type === "text" || block.type === "image";
        
        if (!isFloating) return;
        
        // Don't drag if clicking buttons or inputs, unless forceDrag is true
        if (!forceDrag && (e.target as HTMLElement).closest("button, select, [contenteditable=true]")) return;

        e.preventDefault();
        
        // PLUCK LOGIC: Standard blocks use HTML DnD for moving.
        if (isStandard && forceDrag) return;

        dragOffset.current = {
            x: e.clientX - (block.props.x || 0),
            y: e.clientY - (block.props.y || 0)
        };

        setIsDragging(true);

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const newX = moveEvent.clientX - dragOffset.current.x;
            const newY = moveEvent.clientY - dragOffset.current.y;
            
            // USE LOCAL STATE FOR PERFORMANCE
            setTmpPos({ x: newX, y: newY });
            
            // Update toolbar position in real-time
            if (blockRef.current) {
                const rect = blockRef.current.getBoundingClientRect();
                setToolbarPos({ top: rect.top, left: rect.left + rect.width / 2 });
            }
        };

        const handleMouseUp = (upEvent: MouseEvent) => {
            // Calculate final position from event to avoid stale closure on tmpPos
            const finalX = upEvent.clientX - dragOffset.current.x;
            const finalY = upEvent.clientY - dragOffset.current.y;
            
            // SYNC TO GLOBAL STATE ONLY ON MOUSE UP
            onUpdate("x", finalX);
            onUpdate("y", finalY);
            
            setIsDragging(false);
            setTmpPos(null);
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
    };



    const renderBlock = () => {
        const p = block.props;
        const scale = (viewMode === "mobile" && brandTypography) ? brandTypography.mobileScale : 1;
        const getFontSize = (size: number) => Math.round(size * scale);

        switch (block.type) {
            case "text":
            case "floating-text": {
                const isFloating = block.type === "floating-text";
                return (
                    <div style={{
                        padding: isFloating ? (p.padding || 12) : "4px 0",
                        backgroundColor: isFloating ? (p.backgroundColor || "transparent") : "transparent",
                        border: isFloating ? `${p.borderWidth || 0}px solid ${p.borderColor || "transparent"}` : "none",
                        borderRadius: isFloating ? (p.borderRadius || design.theme.borderRadius || 0) : 0,
                        width: isFloating ? (p.width || 200) : "100%",
                        maxWidth: isFloating ? `calc(100% - ${p.x || 0}px)` : "none",
                        boxShadow: (isFloating && isSelected) ? "0 4px 12px rgba(0,0,0,0.1)" : "none",
                        position: "relative",
                        boxSizing: "border-box",
                        overflowWrap: "anywhere" // Ensure long words don't overflow
                    }}>
                        <StableText
                            isSelected={isSelected}
                            content={block.props.content || ""}
                            linkUrl={p.linkUrl}
                            onBlur={handleBlur}
                            onDoubleClick={(e: any) => {
                                const target = e.target as HTMLElement;
                                const inlineLink = target.closest("a");
                                if (inlineLink && inlineLink.href) {
                                    e.stopPropagation();
                                    window.open(inlineLink.href, "_blank");
                                    return;
                                }
                                if (p.linkUrl) {
                                    e.stopPropagation();
                                    window.open(p.linkUrl, "_blank");
                                }
                            }}
                            style={{
                                fontSize: getFontSize(p.fontSize || 16), color: p.color || design.theme.paragraphColor || "#475569",
                                textAlign: (p.align as any) || "left", fontWeight: p.fontWeight || "normal",
                                fontStyle: p.fontStyle || "normal", fontFamily: p.fontFamily || "inherit",
                                lineHeight: p.lineHeight || 1.6, 
                                letterSpacing: p.letterSpacing ? `${p.letterSpacing}px` : "normal",
                                outline: "none", minHeight: 24, cursor: isSelected ? "text" : (isFloating ? "move" : "pointer"),
                            }}
                        />
                    </div>
                );
            }
            case "image":
                return (
                    <div style={{ display: "flex", justifyContent: (p.align as any) || "center", width: "100%" }}>
                        <img 
                            src={p.src || "https://placehold.co/540x200"} 
                            alt={p.alt || ""} 
                            onDoubleClick={(e) => {
                                e.stopPropagation();
                                handleOpenLink();
                            }}
                            onMouseDownCapture={startLongPress}
                            onMouseUpCapture={endLongPress}
                            onMouseLeave={endLongPress}
                            style={{ 
                                width: p.width || "100%", 
                                maxWidth: "100%", 
                                height: "auto", 
                                borderRadius: p.borderRadius || design.theme.borderRadius || 4, 
                                display: "block",
                                boxShadow: p.shadow ? `0 ${p.shadow}px ${p.shadow * 3}px ${p.shadowColor || "rgba(0,0,0,0.1)"}` : "none",
                                cursor: p.linkUrl ? "pointer" : "default" 
                            }} 
                        />
                    </div>
                );
            case "floating-image":
                return (
                    <div style={{ padding: p.padding || 0 }}>
                        <img 
                            src={p.src || "https://placehold.co/540x200"} 
                            alt={p.alt || ""} 
                            onDoubleClick={(e) => {
                                e.stopPropagation();
                                handleOpenLink();
                            }}
                            style={{ 
                                width: p.width || 200, 
                                maxWidth: `calc(100% - ${p.x || 0}px)`,
                                height: "auto", 
                                borderRadius: p.borderRadius || design.theme.borderRadius || 0,
                                border: `${p.borderWidth || 0}px solid ${p.borderColor || "transparent"}`,
                                display: "block",
                                boxShadow: p.shadow ? `0 ${p.shadow}px ${p.shadow * 3}px ${p.shadowColor || "rgba(0,0,0,0.1)"}` : "none",
                                cursor: p.linkUrl ? "pointer" : "move"
                            }} 
                        />
                    </div>
                );
            case "button":
                return (
                    <div style={{ textAlign: (p.align as any) || "center" }}>
                        <div 
                            onClick={(e) => {
                                if (p.url && p.url !== "#") {
                                    cleanOpen(p.url);
                                }
                            }}
                            onDoubleClick={(e) => {
                                e.stopPropagation();
                                cleanOpen(p.url);
                            }}
                            onMouseDownCapture={() => {
                                if (!p.url || p.url === "#") return;
                                (longPressTimer as any).current = setTimeout(() => {
                                    cleanOpen(p.url);
                                }, 600);
                            }}
                            onMouseUpCapture={() => {
                                if ((longPressTimer as any).current) {
                                    clearTimeout((longPressTimer as any).current);
                                    (longPressTimer as any).current = null;
                                }
                            }}
                            onMouseLeave={() => {
                                if ((longPressTimer as any).current) {
                                    clearTimeout((longPressTimer as any).current);
                                    (longPressTimer as any).current = null;
                                }
                            }}
                            style={{
                                display: "inline-block", padding: `14px 28px`,
                                background: p.backgroundColor || design.theme.primaryColor || "#6366F1", 
                                color: p.color || "#fff",
                                border: `${p.borderWidth || 0}px solid ${p.borderColor || "transparent"}`,
                                borderRadius: p.borderRadius || design.theme.borderRadius || 8, textDecoration: "none",
                                fontWeight: p.fontWeight || 600, fontSize: getFontSize(p.fontSize || 14), 
                                lineHeight: p.lineHeight || 1,
                                letterSpacing: p.letterSpacing ? `${p.letterSpacing}px` : "normal",
                                boxShadow: p.shadow ? `0 ${p.shadow}px ${p.shadow * 3}px ${p.shadowColor || "rgba(0,0,0,0.2)"}` : "none",
                                cursor: isSelected ? "pointer" : "default",
                                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                            }}>{p.text || "Button"}</div>
                    </div>
                );
            case "divider":
                return (
                    <div style={{ padding: "24px 0", cursor: "pointer", background: "transparent" }}>
                        <div style={{ borderTop: `${p.thickness || 1}px solid ${p.color || "#E5E7EB"}`, width: "100%" }} />
                    </div>
                );
            case "spacer":
                return (
                    <div style={{ 
                        height: p.height || 32, 
                        background: "transparent", 
                        border: "1px dashed rgba(0,0,0,0.05)", 
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyItems: "center",
                        justifyContent: "center",
                        color: "#94A3B8",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer"
                    }}>
                        Spacer ({p.height || 32}px)
                    </div>
                );
            case "social":
                return (
                    <div style={{ textAlign: (p.align as any) || "center", display: "flex", justifyContent: p.align || "center", gap: 12, padding: "8px 0" }}>
                        {(p.icons || []).map((icon: any, i: number) => {
                            const brandColors: any = { 
                                facebook: "#1877F2", instagram: "#E4405F", twitter: "#000000", 
                                linkedin: "#0A66C2", youtube: "#FF0000", whatsapp: "#25D366" 
                            };
                            const iconStyle: React.CSSProperties = {
                                width: 38, height: 38, borderRadius: 10, background: "#F1F5F9", 
                                display: "flex", alignItems: "center", justifyContent: "center", 
                                color: "#64748B", cursor: icon.url ? "pointer" : "default",
                                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                border: "1px solid transparent"
                            };

                            return (
                                <div 
                                    key={i} 
                                    style={iconStyle}
                                    title={icon.url && icon.url !== "#" ? `Open ${icon.url}` : "Double-click to set URL"}
                                    onMouseEnter={(e) => {
                                        if (icon.url && icon.url !== "#") {
                                            e.currentTarget.style.background = "#fff";
                                            e.currentTarget.style.color = brandColors[icon.platform] || "#6366F1";
                                            e.currentTarget.style.borderColor = brandColors[icon.platform] || "#6366F1";
                                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                                            e.currentTarget.style.transform = "translateY(-2px)";
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = "#F1F5F9";
                                        e.currentTarget.style.color = "#64748B";
                                        e.currentTarget.style.borderColor = "transparent";
                                        e.currentTarget.style.boxShadow = "none";
                                        e.currentTarget.style.transform = "translateY(0)";
                                    }}
                                    onDoubleClick={(e) => {
                                        e.stopPropagation();
                                        cleanOpen(icon.url);
                                    }}
                                    onMouseDownCapture={() => {
                                        const u = (icon.url || "").trim().replace(/^#/, "");
                                        if (!u) return;
                                        (longPressTimer as any).current = setTimeout(() => {
                                            cleanOpen(icon.url);
                                        }, 600);
                                    }}
                                    onMouseUpCapture={() => {
                                        if ((longPressTimer as any).current) {
                                            clearTimeout((longPressTimer as any).current);
                                            (longPressTimer as any).current = null;
                                        }
                                    }}
                                >
                                    {icon.platform === "facebook" && <Facebook size={18} />}
                                    {icon.platform === "instagram" && <Instagram size={18} />}
                                    {icon.platform === "twitter" && <Twitter size={18} />}
                                    {icon.platform === "linkedin" && <Linkedin size={18} />}
                                    {icon.platform === "youtube" && <Youtube size={18} />}
                                    {icon.platform === "whatsapp" && <MessageCircle size={18} />}
                                    {!["facebook", "instagram", "twitter", "linkedin", "youtube", "whatsapp"].includes(icon.platform) && (
                                        icon.platform?.[0]?.toUpperCase() || "?"
                                    )}
                                </div>
                            );
                        })}
                    </div>
                );
            case "hero":
                return (
                    <div style={{ background: p.bgColor || "#6366F1", padding: "40px 24px", borderRadius: 12, textAlign: "center" }}>
                        <div style={{ 
                            fontSize: getFontSize(p.fontSize || 24), fontWeight: p.fontWeight || 700, color: p.textColor || "#fff", marginBottom: 8,
                            lineHeight: p.lineHeight || 1.2,
                            letterSpacing: p.letterSpacing ? `${p.letterSpacing}px` : "normal"
                        }}>{p.headline || "Hero Headline"}</div>
                        <div style={{ 
                            fontSize: 15, color: "rgba(255,255,255,0.8)", marginBottom: p.btnText ? 24 : 0,
                            lineHeight: 1.5
                        }}>{p.subheadline || "Subheadline text"}</div>
                         {p.btnText && (
                            <div 
                                onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    cleanOpen(p.btnUrl);
                                }}
                                style={{
                                    display: "inline-block", padding: "12px 24px", background: "#fff", color: p.bgColor || "#6366F1",
                                    borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                                }}>
                                {p.btnText}
                            </div>
                        )}
                    </div>
                );
            case "footer":
                return (
                    <div style={{ padding: "32px 20px", textAlign: (p.align as any) || "center" }}>
                        <div style={{ 
                            fontSize: getFontSize(p.fontSize || 12), 
                            color: p.color || "#9CA3AF",
                            lineHeight: p.lineHeight || 1.5,
                            letterSpacing: p.letterSpacing ? `${p.letterSpacing}px` : "normal"
                        }}>
                            {p.content || "© Company · Unsubscribe"}
                        </div>
                    </div>
                );
            case "shape":
                return (
                    <div style={{ textAlign: (p.align as any) || "center", padding: "8px 0" }}>
                        <div style={{ display: "inline-block", width: "100%", textAlign: (p.align as any) || "center" }}>
                            {p.shapeType === "triangle" ? (
                                <svg width={p.width || 100} height={p.height || 100} viewBox="0 0 100 100" style={{ display: "inline-block" }}>
                                    <path d="M 50 0 L 100 100 L 0 100 Z" fill={p.backgroundColor || "#6366F1"} stroke={p.borderColor} strokeWidth={p.borderWidth} />
                                </svg>
                            ) : (
                                <div style={{
                                    display: "inline-block",
                                    width: p.width || 100,
                                    height: p.height || 100,
                                    backgroundColor: p.backgroundColor || "#6366F1",
                                    border: `${p.borderWidth || 0}px solid ${p.borderColor || "transparent"}`,
                                    borderRadius: p.shapeType === "circle" ? "50%" : (p.borderRadius || 0),
                                    boxShadow: p.shadow ? `0 ${p.shadow}px ${p.shadow * 3}px ${p.shadowColor || "rgba(0,0,0,0.1)"}` : "none",
                                }} />
                            )}
                        </div>
                    </div>
                );
            case "line":
                return (
                    <div style={{ 
                        paddingTop: p.paddingTop || 10, 
                        paddingBottom: p.paddingBottom || 10,
                        textAlign: (p.align as any) || "center"
                    }}>
                        <div style={{ 
                            borderTop: `${p.thickness || 2}px ${p.lineType || "solid"} ${p.color || "#475569"}`, 
                            width: p.width || "100%",
                            display: "inline-block"
                        }} />
                    </div>
                );
            case "layout": {
                const colCount = p.layoutType === "3-col" ? 3 : (p.layoutType === "1-col" ? 1 : 2);
                const gap = p.gap || 20;
                const pad = p.padding || 20;
                return (
                    <div style={{ padding: pad, display: "flex", flexDirection: viewMode === "mobile" ? "column" : "row", gap: gap, backgroundColor: "transparent" }}>
                        {Array.from({ length: colCount }).map((_, i) => (
                            <div key={i} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                                <div style={{ 
                                    minHeight: 80, padding: 12, background: isSelected ? "rgba(99,102,241,0.05)" : "transparent", 
                                    borderRadius: 8, border: isSelected ? "1px dashed rgba(99,102,241,0.2)" : "none" 
                                }}>
                                    <StableText
                                        isSelected={isSelected}
                                        content={p.columns?.[i]?.content || "Enter text..."}
                                        onBlur={(e: any) => {
                                            const newCols = [...(p.columns || [])];
                                            if (!newCols[i]) newCols[i] = { content: "" };
                                            newCols[i] = { ...newCols[i], content: e.currentTarget.innerHTML };
                                            onUpdate("columns", newCols);
                                        }}
                                        style={{ 
                                            fontSize: 14, color: design.theme.paragraphColor || "#475569", 
                                            textAlign: "left", lineHeight: 1.5, outline: "none" 
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                );
            }
            default:
                return <div>Unknown block</div>;
        }
    };

    return (
        <div
            ref={blockRef}
            data-block-id={block.id}
            onClick={(e) => { e.stopPropagation(); handleSelect(); }}
            onMouseEnter={onHover}
            onMouseLeave={() => {
                onLeave();
                endLongPress();
            }}
            draggable={isDraggable && (block.type === "text" || block.type === "image" || block.type === "floating-text" || block.type === "floating-image")}
            onDragStart={(e) => {
                if (window.getSelection()) window.getSelection()!.removeAllRanges();

                e.dataTransfer.setData("moveBlock", JSON.stringify({ blockId: block.id, sourceZone: zone }));
                e.dataTransfer.effectAllowed = "move";
                draggedBlockId.current = { id: block.id, zone }; 
                
                if (blockRef.current) {
                    setLocalDragPos({ x: e.clientX, y: e.clientY });
                    setStartDragPos({ x: e.clientX, y: e.clientY });
                    
                    const img = new Image();
                    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                    e.dataTransfer.setDragImage(img, 0, 0);
                    
                    setTimeout(() => setLocalDragging(true), 0);
                }
            }}
            onDrag={(e) => {
                if (e.clientX === 0 && e.clientY === 0) return; // Ignore final frame
                setLocalDragPos({ x: e.clientX, y: e.clientY });
            }}
            onDragEnd={() => {
                draggedBlockId.current = null;
                setDropIndicator(null);
                setLocalDragging(false);
            }}
            style={{
                position: (block.type === "floating-text" || block.type === "floating-image") ? "absolute" : "relative",
                top: (block.type === "floating-text" || block.type === "floating-image") ? (block.props.y || 0) : undefined,
                left: (block.type === "floating-text" || block.type === "floating-image") ? (block.props.x || 0) : undefined,
                zIndex: localDragging ? 1000 : ((block.type === "floating-text" || block.type === "floating-image") ? 100 : 1),
                marginBottom: (block.type === "floating-text" || block.type === "floating-image") ? 0 : 2,
                boxShadow: isSelected ? "0 0 0 2px #6366F1" : (isHovered ? "0 0 0 2px #E2E8F0" : "none"),
                borderRadius: 8,
                transition: localDragging ? "none" : "all 0.1s ease-out", 
                backgroundColor: "transparent",
                cursor: localDragging ? "grabbing" : (isSelected ? "move" : "default"),
                opacity: localDragging ? 0.8 : ((p.hideOnMobile && viewMode === "mobile") ? 0.4 : 1),
                filter: (p.hideOnMobile && viewMode === "mobile") ? "grayscale(100%)" : "none",
                maxWidth: (block.type === "floating-text" || block.type === "floating-image") ? `calc(100% - ${(block.props.x || 0)}px)` : "100%",
                pointerEvents: localDragging ? "none" : "auto", 
                transform: localDragging ? `translate3d(${localDragPos.x - startDragPos.x}px, ${localDragPos.y - startDragPos.y}px, 0)` : undefined, 
            }}
        >
            {(p.hideOnMobile && viewMode === "mobile") && (
                <div style={{ 
                    position: "absolute", top: -10, left: 10, background: "#64748B", color: "#fff", 
                    fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4, zIndex: 10,
                    textTransform: "uppercase", letterSpacing: "0.05em", boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                }}>Hidden on Mobile</div>
            )}
            {/* ── Visual Grip Handle for Selected Blocks ── */}
            {(block.type === "floating-text" || block.type === "text" || block.type === "floating-image" || block.type === "image") && isSelected && (
                <div 
                    onMouseEnter={() => setIsDraggable(true)}
                    onMouseLeave={() => setIsDraggable(false)}
                    style={{
                        position: "absolute",
                        top: -12,
                        left: -12,
                        width: 24,
                        height: 24,
                        background: "#6366F1",
                        color: "white",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "move",
                        zIndex: 110,
                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    }}
                >
                    <GripVertical size={14} />
                </div>
            )}
            {/* ── 1. STABLE BLOCK CONTENT (Must never re-mount) ── */}
            <div key="stable-content">
                {renderBlock()}
            </div>



            {isSelected && toolbarPos && (
                <FloatingToolbar 
                    key="floating-toolbar"
                    block={block} onUpdate={onUpdate} position={toolbarPos} 
                    onDuplicate={onDuplicate} onDelete={onDelete} 
                    onAddLink={handleAddLink} 
                />
            )}
        </div>
    );
}

// ── CANVAS COMPONENT ───────────────────────────────────────────────────────
export default function EditorCanvas({
    design, brandTypography, selectedNode, hoveredBlock, viewMode,
    onSelectNode, onHoverBlock, onLeaveBlock,
    onUpdateBlockProp, onBulkUpdateBlock, onAddBlockToZone, onMoveBlock, onDuplicateBlock, onDeleteBlock,
}: {
    design: DesignJSON; brandTypography?: BrandTypography; selectedNode: SelectedNode | null; hoveredBlock: string | null; viewMode: "desktop" | "mobile";
    onSelectNode: (node: SelectedNode | null) => void; onHoverBlock: (id: string) => void; onLeaveBlock: () => void;
    onUpdateBlockProp: (blockId: string, key: string, val: any) => void;
    onBulkUpdateBlock: (blockId: string, updates: Record<string, any>, newType?: BlockType) => void;
    onAddBlockToZone: (zone: "header" | "body" | "footer", blockType: BlockType, props?: any, destIndex?: number) => void; 
    onMoveBlock: (blockId: string, sZone: string, dZone: string, destIndex?: number) => void;
    onDuplicateBlock: (blockId: string) => void; onDeleteBlock: (blockId: string) => void;
}) {
    const [dropIndicator, setDropIndicator] = useState<{ zone: string, index: number, y: number } | null>(null);
    const draggedBlockId = useRef<{ id: string, zone: string } | null>(null);
    const zonesWithContent = ["header", "body", "footer"].filter(z => (design as any)[`${z}Blocks`]?.length > 0);

    const renderZone = (zone: "header" | "body" | "footer", blocks: DesignBlock[]) => {
        const zoneColors = { header: "#6366F1", body: "#0EA5E9", footer: "#A855F7" };

        return (
            <div
                data-zone={zone}
                style={{
                    minHeight: zonesWithContent.includes(zone) 
                        ? (zone === "body" ? 500 : 40) 
                        : (zone === "body" ? 300 : 20),
                    padding: zone === "body" ? "40px" : "50px 40px",
                    borderBottom: (zone === "header" || zone === "body") ? "1px solid rgba(0,0,0,0.05)" : "none",
                    position: "relative",
                    transition: "all 0.2s ease",
                    cursor: "text",
                    flex: zone === "body" ? 1 : "0 0 auto",
                    width: "100%",
                    boxSizing: "border-box",
                    borderTop: zone !== "header" ? "1px dashed rgba(0,0,0,0.05)" : "none"
                }}
                onDragOver={(e) => { 
                    // Let the canvas handle detection for cross-zone and indexing, 
                    // but we still need preventDefault to allow dropping.
                    e.preventDefault(); 
                }}
                onDragLeave={(e) => { 
                    // Clean up highlight if needed
                }}
                onClick={(e) => {
                    // Only trigger if clicking the zone background itself, not a block
                    if (e.target === e.currentTarget) {
                        e.stopPropagation();
                        onAddBlockToZone(zone, "text");
                    }
                }}
            >
                <div className="blocks-container" style={{ width: "100%", maxWidth: 800, margin: "0 auto", position: "relative", zIndex: 1 }}>
                    {blocks.map((block, idx) => {
                        const isDropTarget = dropIndicator?.zone === zone && dropIndicator.index === idx;
                        return (
                            <React.Fragment key={block.id}>
                                {isDropTarget && (
                                    <div style={{ 
                                        height: 60, 
                                        width: "100%", 
                                        border: "2px dashed #6366F1", 
                                        borderRadius: 8, 
                                        marginBottom: 10,
                                        background: "rgba(99, 102, 241, 0.03)",
                                        animation: "fadeSlideUp 0.3s ease-out"
                                    }} />
                                )}
                                <EditableBlock
                                    block={block}
                                    isSelected={selectedNode?.type === "block" && selectedNode?.id === block.id}
                                    isHovered={hoveredBlock === block.id}
                                    onSelect={() => onSelectNode({ type: "block", id: block.id })}
                                    onHover={() => onHoverBlock(block.id)}
                                    onLeave={onLeaveBlock}
                                    onUpdate={(key, val) => onUpdateBlockProp(block.id, key, val)}
                                    onBulkUpdate={(updates, newType) => onBulkUpdateBlock(block.id, updates, newType)}
                                    onDuplicate={() => onDuplicateBlock(block.id)}
                                    onDelete={() => onDeleteBlock(block.id)}
                                    zone={zone}
                                    index={idx}
                                    design={design}
                                    viewMode={viewMode}
                                    draggedBlockId={draggedBlockId}
                                    setDropIndicator={setDropIndicator}
                                    brandTypography={brandTypography}
                                />
                            </React.Fragment>
                        );
                    })}
                    {/* End of zone drop target */}
                    {dropIndicator?.zone === zone && dropIndicator.index === blocks.length && (
                        <div style={{ 
                            height: 60, 
                            width: "100%", 
                            border: "2px dashed #6366F1", 
                            borderRadius: 8, 
                            marginTop: 10,
                            background: "rgba(99, 102, 241, 0.03)",
                            animation: "fadeSlideUp 0.3s ease-out"
                        }} />
                    )}
                </div>

            </div>
        );
    };

    return (
        <div 
            id="editor-scroll-container"
            style={{ 
            flex: 1, 
            display: "block", 
            minHeight: 0, 
            height: "100%", 
            width: "100%", 
            paddingTop: 20, 
            paddingBottom: 40,
            overflowY: "auto",
            overflowX: "hidden",
            backgroundColor: viewMode === "mobile" ? "#0F172A" : "transparent", // Dark room for mobile
            transition: "background-color 0.4s ease"
        }} 
        onClick={() => onSelectNode(null)}
        onScroll={() => window.dispatchEvent(new Event("canvas-scroll"))}
        >
            <div data-canvas-wrapper className={viewMode === "mobile" ? "mobile-frame" : ""} style={{ 
                margin: "0 auto",
                width: viewMode === "desktop" ? 600 : 375, 
                height: viewMode === "mobile" ? 667 : "auto",
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)", 
                position: "relative",
                display: "block",
                backgroundColor: viewMode === "mobile" ? "#0F172A" : "transparent", // FORCE DARK BACKGROUND
                overflow: viewMode === "mobile" ? "auto" : "visible",
                paddingLeft: viewMode === "mobile" ? 24 : 0, // More generous gutter
                paddingRight: viewMode === "mobile" ? 24 : 0,
                paddingTop: viewMode === "mobile" ? 20 : 0,
                paddingBottom: viewMode === "mobile" ? 20 : 0,
            }}>
                <div 
                    data-canvas 
                    onDragOver={e => {
                        e.preventDefault();
                        const draggedId = draggedBlockId.current?.id;

                        const rect = e.currentTarget.getBoundingClientRect();
                        const zoneNodes = Array.from(e.currentTarget.querySelectorAll('[data-zone]'));
                        
                        let targetZone: any = "body";
                        let destIndex = 0;
                        let indicatorY = 0;

                        if (zoneNodes.length > 0) {
                            for (const node of zoneNodes) {
                                const nodeRect = node.getBoundingClientRect();
                                // Check if we are inside or closest to this zone
                                if (e.clientY >= nodeRect.top && e.clientY <= nodeRect.bottom) {
                                    targetZone = node.getAttribute('data-zone');
                                    break;
                                }
                            }
                        }

                        // Calculate index within the final targetZone
                        const targetNode = e.currentTarget.querySelector(`[data-zone="${targetZone}"]`) as HTMLElement;
                        if (targetNode) {
                            const allInZone = Array.from(targetNode.querySelectorAll('[data-block-id]'));
                            const otherNodes = allInZone.filter(n => n.getAttribute('data-block-id') !== draggedId);
                            
                            destIndex = otherNodes.length;
                            const tRect = targetNode.getBoundingClientRect();
                            indicatorY = tRect.bottom - rect.top; 

                            for (let i = 0; i < otherNodes.length; i++) {
                                const bRect = (otherNodes[i] as HTMLElement).getBoundingClientRect();
                                if (e.clientY < (bRect.top + bRect.bottom) / 2) {
                                    destIndex = i;
                                    indicatorY = bRect.top - rect.top;
                                    break;
                                }
                            }
                        }
                        setDropIndicator({ zone: targetZone, index: destIndex, y: indicatorY });
                    }}
                    onDragLeave={() => setDropIndicator(null)}
                    onDrop={(e) => {
                        e.preventDefault();
                        const targetZone = dropIndicator?.zone || "body";
                        const destIndex = dropIndicator?.index;
                        const moveObj = draggedBlockId.current; // Re-use ref instead of dataTransfer
                        
                        setDropIndicator(null);
                        draggedBlockId.current = null;

                        if (moveObj) {
                            onMoveBlock(moveObj.id, moveObj.zone, targetZone, destIndex);
                            return;
                        }

                        const bt = e.dataTransfer.getData("blockType") as BlockType;
                        const bp = e.dataTransfer.getData("blockProps");
                        if (bt) { 
                            onAddBlockToZone(targetZone as any, bt, bp ? JSON.parse(bp) : undefined, destIndex);
                            return;
                        }

                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            const file = e.dataTransfer.files[0];
                            if (file.type.startsWith("image/")) {
                                onAddBlockToZone(targetZone as any, "image", { src: URL.createObjectURL(file) }, destIndex);
                            }
                        }
                    }}
                    style={{
                        width: "100%", // Fill the wrapper width (600 or 375)
                        background: design.theme.background || "#ffffff",
                        borderRadius: viewMode === "mobile" ? 0 : 12, 
                        overflow: "hidden", 
                        boxShadow: viewMode === "mobile" ? "none" : "0 25px 50px -12px rgba(0,0,0,0.1), 0 15px 25px -10px rgba(0,0,0,0.05)",
                        minHeight: viewMode === "mobile" ? "100%" : "calc(100vh - 120px)",
                        border: viewMode === "mobile" ? "none" : "1px solid rgba(0,0,0,0.03)",
                        display: "flex",
                        flexDirection: "column",
                        padding: "0",
                        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                        position: "relative",
                        fontFamily: design.settings?.global?.fontFamily || design.theme.fontFamily,
                        filter: design.settings?.global?.darkMode ? "invert(1) hue-rotate(180deg)" : "none",
                    }}>
                    {renderZone("header", design.headerBlocks)}
                    {renderZone("body", design.bodyBlocks)}
                    {renderZone("footer", design.footerBlocks)}
                </div>
            </div>
            <style>{`
                @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                [contenteditable]:empty:before { content: ""; color: #9CA3AF; cursor: text; }
                
                .mobile-frame {
                    border: 2px solid #334155; // Darker bezel for dark frame
                    border-top-width: 14px;
                    border-bottom-width: 14px;
                    border-radius: 32px;
                    padding: 0;
                    background: #0F172A; // Premium Black/Dark Slate backdrop
                    box-shadow: 0 4px 20px -5px rgba(0,0,0,0.2), 0 10px 10px -5px rgba(0,0,0,0.1);
                    position: relative;
                }
                .mobile-frame::before {
                    content: "";
                    position: absolute;
                    top: -10px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 40px;
                    height: 3px;
                    background: #334155; // Subtler notch on dark frame
                    border-radius: 10px;
                    z-index: 10;
                }
            `}</style>
        </div>
    );
}
