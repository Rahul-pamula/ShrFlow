"use client";

import React, { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";

interface FabricBlockWrapperProps {
    width: number;
    height: number;
    onUpdate: (updates: Record<string, any>) => void;
    children: (canvas: fabric.Canvas | null) => React.ReactNode;
    isSelected: boolean;
    blockId: string;
}

export const FabricBlockWrapper = ({ 
    width, 
    height, 
    onUpdate, 
    children,
    isSelected,
    blockId
}: FabricBlockWrapperProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!canvasRef.current || !containerRef.current) return;

        // Initialize Fabric Canvas
        const fc = new fabric.Canvas(canvasRef.current, {
            width: width,
            height: height,
            backgroundColor: "transparent",
            selection: isSelected,
        });

        // Set default object styles (Canva style)
        fabric.Object.prototype.set({
            cornerColor: "#FFFFFF",
            cornerStyle: "circle",
            borderColor: "#7D2AE8",
            borderScaleFactor: 2,
            transparentCorners: false,
            cornerStrokeColor: "#7D2AE8",
            cornerSize: 10,
            padding: 0,
        });

        setCanvas(fc);

        // Handle modification events
        const handleModified = (e: fabric.IEvent) => {
            const obj = e.target;
            if (!obj) return;

            // Extract transformations
            const updates: Record<string, any> = {
                left: obj.left,
                top: obj.top,
                scaleX: obj.scaleX,
                scaleY: obj.scaleY,
                angle: obj.angle,
                width: obj.width! * obj.scaleX!,
                height: obj.height! * obj.scaleY!,
                text: (obj as any).text,
            };

            onUpdate(updates);
        };

        fc.on("object:modified", handleModified);
        fc.on("text:changed", handleModified);

        return () => {
            fc.dispose();
        };
    }, []); // Only init once

    // Sync dimensions
    useEffect(() => {
        if (canvas) {
            canvas.setDimensions({ width, height });
            canvas.renderAll();
        }
    }, [width, height, canvas]);

    // Sync selection state
    useEffect(() => {
        if (canvas) {
            canvas.selection = isSelected;
            if (!isSelected) {
                canvas.discardActiveObject();
            }
            canvas.renderAll();
        }
    }, [isSelected, canvas]);

    return (
        <div 
            ref={containerRef} 
            className="fabric-block-container"
            style={{ 
                width: "100%", 
                height: "100%", 
                position: "relative",
                overflow: "visible"
            }}
        >
            <canvas ref={canvasRef} />
            {children(canvas)}
        </div>
    );
};
