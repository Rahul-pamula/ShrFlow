"use client";

import React, { useEffect, useState, useRef } from "react";
import { useEditorStore } from "@/store/useEditorStore";
import { Move, Copy, Trash2, RotateCw } from "lucide-react";

export function SelectionOverlay() {
    const { selectedNode, design, updateBlockProp, deleteBlock, duplicateBlock } = useEditorStore();
    const [rect, setRect] = useState<{ top: number, left: number, width: number, height: number } | null>(null);
    const observer = useRef<ResizeObserver | null>(null);

    useEffect(() => {
        if (!selectedNode || selectedNode.type !== "block") {
            setRect(null);
            return;
        }

        const el = document.getElementById(selectedNode.id);
        if (!el) {
            setRect(null);
            return;
        }

        const updateRect = () => {
            const canvas = document.getElementById("editor-canvas-viewport");
            if (!canvas) return;
            
            const canvasRect = canvas.getBoundingClientRect();
            const elRect = el.getBoundingClientRect();

            setRect({
                top: elRect.top - canvasRect.top,
                left: elRect.left - canvasRect.left,
                width: elRect.width,
                height: elRect.height
            });
        };

        updateRect();
        
        observer.current = new ResizeObserver(updateRect);
        observer.current.observe(el);
        
        window.addEventListener("scroll", updateRect, true);
        window.addEventListener("resize", updateRect);

        return () => {
            observer.current?.disconnect();
            window.removeEventListener("scroll", updateRect, true);
            window.removeEventListener("resize", updateRect);
        };
    }, [selectedNode, design]);

    const [isResizing, setIsResizing] = useState<string | null>(null);
    const startPos = useRef({ x: 0, y: 0, width: 0, height: 0 });

    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!rect || !selectedNode) return;
            const dx = e.clientX - startPos.current.x;
            const dy = e.clientY - startPos.current.y;

            const updates: any = {};
            if (isResizing.includes("right")) updates.width = Math.max(20, startPos.current.width + dx);
            if (isResizing.includes("bottom")) updates.height = Math.max(20, startPos.current.height + dy);

            // Update the block in real-time (no history push yet)
            // Actually, for performance, we might want to only update local rect first
            // But let's try direct store update for now
            updateBlockProp(selectedNode.id, "width", updates.width);
            if (updates.height) updateBlockProp(selectedNode.id, "height", updates.height);
        };

        const handleMouseUp = () => {
            setIsResizing(null);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isResizing, rect, selectedNode, updateBlockProp]);

    if (!rect) return null;

    const onResizeStart = (e: React.MouseEvent, handle: string) => {
        e.stopPropagation();
        e.preventDefault();
        setIsResizing(handle);
        startPos.current = { x: e.clientX, y: e.clientY, width: rect.width, height: rect.height };
    };

    const handleStyle: React.CSSProperties = {
        position: "absolute",
        width: 12,
        height: 12,
        background: "#fff",
        border: "2px solid #7D2AE8",
        borderRadius: "50%",
        zIndex: 100,
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        pointerEvents: "auto"
    };

        const allBlocks = [...design.headerBlocks, ...design.bodyBlocks, ...design.footerBlocks];
        const block = allBlocks.find(b => b.id === selectedNode.id);
        const isFabricBlock = block && ["image", "floating-image", "floating-text"].includes(block.type);

        return (
            <div style={{
                position: "absolute",
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
                border: isFabricBlock ? "none" : "2px solid #7D2AE8",
                pointerEvents: "none",
                zIndex: 99,
                transition: isResizing ? "none" : "all 0.1s ease-out"
            }}>
                {!isFabricBlock && (
                    <>
                        <div onMouseDown={(e) => onResizeStart(e, "top-left")} style={{ ...handleStyle, top: -6, left: -6, cursor: "nwse-resize" }} />
                        <div onMouseDown={(e) => onResizeStart(e, "top-right")} style={{ ...handleStyle, top: -6, right: -6, cursor: "nesw-resize" }} />
                        <div onMouseDown={(e) => onResizeStart(e, "bottom-left")} style={{ ...handleStyle, bottom: -6, left: -6, cursor: "nesw-resize" }} />
                        <div onMouseDown={(e) => onResizeStart(e, "bottom-right")} style={{ ...handleStyle, bottom: -6, right: -6, cursor: "nwse-resize" }} />
                    </>
                )}

            {/* Floating Toolbar */}
            <div style={{
                position: "absolute",
                top: -48,
                left: "50%",
                transform: "translateX(-50%)",
                background: "#fff",
                borderRadius: 8,
                padding: "4px 8px",
                display: "flex",
                gap: 4,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                border: "1px solid #E2E8F0",
                pointerEvents: "auto"
            }}>
                <button onClick={() => duplicateBlock(selectedNode.id)} style={toolbarBtn} title="Duplicate"><Copy size={14} /></button>
                <div style={{ width: 1, background: "#E2E8F0", margin: "4px 2px" }} />
                <button onClick={() => deleteBlock(selectedNode.id)} style={{ ...toolbarBtn, color: "#EF4444" }} title="Delete"><Trash2 size={14} /></button>
                <div style={{ width: 1, background: "#E2E8F0", margin: "4px 2px" }} />
                <button style={toolbarBtn} title="Rotate"><RotateCw size={14} /></button>
            </div>
        </div>
    );
}

const toolbarBtn: React.CSSProperties = {
    padding: "6px",
    background: "none",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    color: "#64748B",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.2s"
};
