"use client";

import React, { useEffect } from "react";
import { fabric } from "fabric";
import { FabricBlockWrapper } from "./FabricBlockWrapper";

interface ImageFabricBlockProps {
    block: any;
    isSelected: boolean;
    onUpdate: (key: string, val: any) => void;
}

export const ImageFabricBlock = ({ block, isSelected, onUpdate }: ImageFabricBlockProps) => {
    const { src, width = 540, height = 200, scaleX = 1, scaleY = 1, angle = 0, left = 0, top = 0 } = block.props;

    const handleUpdate = (updates: Record<string, any>) => {
        // Map Fabric updates to DesignJSON props
        Object.entries(updates).forEach(([k, v]) => {
            onUpdate(k, v);
        });
    };

    return (
        <FabricBlockWrapper
            blockId={block.id}
            width={600} // Parent column width typically
            height={height}
            isSelected={isSelected}
            onUpdate={handleUpdate}
        >
            {(canvas) => {
                if (!canvas) return null;

                // Load or sync image object
                const existingImg = canvas.getObjects().find(o => o.name === "main-image") as fabric.Image;

                if (!existingImg) {
                    fabric.Image.fromURL(src, (img) => {
                        img.set({
                            name: "main-image",
                            left: left,
                            top: top,
                            scaleX: scaleX,
                            scaleY: scaleY,
                            angle: angle,
                            selectable: true,
                            hasControls: true,
                            crossOrigin: "anonymous",
                        });
                        
                        // Center if no position
                        if (left === 0 && top === 0) {
                            canvas.centerObject(img);
                        }

                        canvas.add(img);
                        if (isSelected) canvas.setActiveObject(img);
                        canvas.renderAll();
                    }, { crossOrigin: "anonymous" });
                } else {
                    // Sync props if changed from outside (e.g. Inspector)
                    if (existingImg.getSrc() !== src) {
                        existingImg.setSrc(src, () => canvas.renderAll());
                    }
                    existingImg.set({
                        left,
                        top,
                        scaleX,
                        scaleY,
                        angle
                    });
                    canvas.renderAll();
                }

                return null;
            }}
        </FabricBlockWrapper>
    );
};
