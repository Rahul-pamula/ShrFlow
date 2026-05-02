"use client";
import React from "react";

interface ScaledPreviewProps {
    html: string;
    scale?: number;
}

const ScaledPreview = ({ html, scale = 0.25 }: ScaledPreviewProps) => {
    // We use an iframe with srcDoc to render the HTML.
    // We scale the iframe using CSS transform.
    
    return (
        <div style={{ 
            width: "100%", 
            height: "100%", 
            overflow: "hidden", 
            position: "relative",
            background: "#fff"
        }}>
            <div style={{
                width: `${100 / scale}%`,
                height: `${100 / scale}%`,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                pointerEvents: "none",
                position: "absolute",
                top: 0,
                left: 0
            }}>
                <iframe
                    srcDoc={html}
                    title="Template Preview"
                    style={{
                        width: "100%",
                        height: "100%",
                        border: "none",
                        display: "block"
                    }}
                />
            </div>
            
            {/* Overlay to ensure no interaction */}
            <div style={{
                position: "absolute",
                inset: 0,
                zIndex: 1,
                cursor: "pointer"
            }} />
        </div>
    );
};

export default ScaledPreview;
