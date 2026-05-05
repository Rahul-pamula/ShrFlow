"use client";

import React, { useEffect } from "react";
import { fabric } from "fabric";
import { FabricBlockWrapper } from "./FabricBlockWrapper";

interface TextFabricBlockProps {
    block: any;
    isSelected: boolean;
    onUpdate: (key: string, val: any) => void;
}

export const TextFabricBlock = ({ block, isSelected, onUpdate }: TextFabricBlockProps) => {
    const { 
        content = "Edit text", 
        fontSize = 16, 
        fontFamily = "Arial", 
        color = "#000000",
        fontWeight = "normal",
        textAlign = "left",
        left = 0,
        top = 0
    } = block.props;

    const handleUpdate = (updates: Record<string, any>) => {
        onUpdate("content", updates.text);
        onUpdate("left", updates.left);
        onUpdate("top", updates.top);
        onUpdate("fontSize", updates.fontSize);
        // ... more mappings
    };

    return (
        <FabricBlockWrapper
            blockId={block.id}
            width={600}
            height={100} // Dynamic height?
            isSelected={isSelected}
            onUpdate={handleUpdate}
        >
            {(canvas) => {
                if (!canvas) return null;

                const existingText = canvas.getObjects().find(o => o.name === "main-text") as fabric.Textbox;

                if (!existingText) {
                    const textObj = new fabric.Textbox(content.replace(/<[^>]*>/g, ""), {
                        name: "main-text",
                        left,
                        top,
                        fontSize,
                        fontFamily,
                        fill: color,
                        fontWeight,
                        textAlign,
                        width: 580, // Allow wrapping
                        selectable: true,
                        hasControls: true,
                    });
                    
                    canvas.add(textObj);
                    if (isSelected) canvas.setActiveObject(textObj);
                    canvas.renderAll();
                } else {
                    // Update if needed
                    existingText.set({
                        fontSize,
                        fontFamily,
                        fill: color,
                        fontWeight,
                        textAlign,
                        left,
                        top
                    });
                    canvas.renderAll();
                }

                return null;
            }}
        </FabricBlockWrapper>
    );
};
