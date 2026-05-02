"use client";

import React, { useRef } from "react";
import { Upload, Camera, X } from "lucide-react";

interface ImageUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (imageUrl: string) => void;
    token: string | null;
}

export default function ImageUploadModal({ isOpen, onClose, onUpload, token }: ImageUploadModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showUrlInput, setShowUrlInput] = React.useState(false);
    const [uploading, setUploading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [pastedUrl, setPastedUrl] = React.useState("");

    if (!isOpen) return null;

    const handleMyFilesClick = () => {
        if (uploading) return;
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploading(true);
            setError(null);
            
            const formData = new FormData();
            formData.append("file", file);
            
            const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            try {
                const res = await fetch(`${API}/assets/upload`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    },
                    body: formData,
                });
                
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    let detail = errorData.detail || "Upload failed";
                    
                    // Handle FastAPI validation error objects/arrays
                    if (typeof detail !== "string") {
                        if (Array.isArray(detail)) {
                            detail = detail.map((d: any) => d.msg || JSON.stringify(d)).join(", ");
                        } else {
                            detail = JSON.stringify(detail);
                        }
                    }
                    
                    throw new Error(detail);
                }
                const data = await res.json();
                onUpload(data.url);
            } catch (err: any) {
                setError(err.message || "Failed to upload image.");
            } finally {
                setUploading(false);
            }
        }
    };

    const handleGoogleClick = () => {
        window.open("https://images.google.com/", "_blank");
        setShowUrlInput(true);
    };

    const handleUrlSubmit = () => {
        if (pastedUrl.trim()) onUpload(pastedUrl.trim());
    };

    return (
        <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(2px)",
        }}>
            <div style={{
                background: "white", padding: "32px", borderRadius: "16px",
                width: "400px", maxWidth: "90%", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                position: "relative"
            }}>
                <button
                    onClick={onClose}
                    style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", cursor: "pointer", color: "#64748B" }}
                >
                    <X size={20} />
                </button>
                
                <h3 style={{ margin: "0 0 24px 0", fontSize: "20px", fontWeight: 600, color: "#1E293B", textAlign: "center" }}>
                    Select Image Source
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {error && (
                        <div style={{ padding: "12px", backgroundColor: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "8px", color: "#B91C1C", fontSize: "14px", textAlign: "center" }}>
                            {error}
                        </div>
                    )}
                    
                    <button
                        onClick={handleMyFilesClick}
                        disabled={uploading}
                        style={{
                            display: "flex", alignItems: "center", justifyContent: "center", gap: "12px",
                            padding: "16px", backgroundColor: uploading ? "#F1F5F9" : "#F8FAFC", 
                            border: `2px dashed ${uploading ? "#E2E8F0" : "#CBD5E1"}`,
                            borderRadius: "12px", cursor: uploading ? "not-allowed" : "pointer", 
                            color: uploading ? "#94A3B8" : "#334155", fontSize: "16px",
                            fontWeight: 500, transition: "all 0.2s"
                        }}
                    >
                        <Upload size={24} className={uploading ? "animate-pulse" : ""} />
                        {uploading ? "Uploading to Cloud..." : "Upload from My Files"}
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: "none" }}
                        accept="image/*"
                        onChange={handleFileChange}
                    />

                    <div style={{ textAlign: "center", color: "#94A3B8", fontSize: "14px", margin: "4px 0" }}>OR</div>

                    <button
                        onClick={handleGoogleClick}
                        disabled={uploading}
                        style={{
                            display: "flex", alignItems: "center", justifyContent: "center", gap: "12px",
                            padding: "16px", backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0",
                            borderRadius: "12px", cursor: uploading ? "not-allowed" : "pointer", 
                            color: "#334155", fontSize: "16px",
                            fontWeight: 500, transition: "all 0.2s", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                            opacity: uploading ? 0.6 : 1
                        }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Select from Google
                    </button>

                    {showUrlInput && (
                        <div style={{ marginTop: "12px", borderTop: "1px solid #E2E8F0", paddingTop: "16px" }}>
                            <div style={{ fontSize: "14px", fontWeight: 500, color: "#475569", marginBottom: "8px" }}>Paste image address here:</div>
                            <div style={{ display: "flex", gap: "8px" }}>
                                <input 
                                    type="text" 
                                    value={pastedUrl} 
                                    onChange={e => setPastedUrl(e.target.value)} 
                                    placeholder="https://..."
                                    style={{ flex: 1, padding: "10px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", outline: "none", fontSize: "14px" }} 
                                />
                                <button onClick={handleUrlSubmit} style={{ padding: "0 16px", background: "#6366F1", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}>Apply</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
