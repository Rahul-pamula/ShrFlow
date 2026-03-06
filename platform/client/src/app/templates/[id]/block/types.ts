// ── TYPES ──────────────────────────────────────────────────────────────────
export type BlockType = "text" | "image" | "button" | "divider" | "spacer" | "social" | "hero" | "footer";

export interface DesignBlock { id: string; type: BlockType; props: Record<string, any>; }
export interface DesignColumn { id: string; width: number; blocks: DesignBlock[]; }
export interface RowSettings { backgroundColor?: string; paddingTop?: number; paddingBottom?: number; paddingLeft?: number; paddingRight?: number; }
export interface DesignRow { id: string; settings: RowSettings; columns: DesignColumn[]; }
export interface DesignTheme { background: string; contentWidth: number; fontFamily: string; primaryColor: string; }
export interface DesignJSON { theme: DesignTheme; rows: DesignRow[]; }

export interface SelectedNode { type: "row" | "column" | "block"; id: string; }

// ── DEFAULTS ───────────────────────────────────────────────────────────────
export const DEFAULT_THEME: DesignTheme = {
    background: "#f8f9fb", contentWidth: 600,
    fontFamily: "'Inter', Arial, sans-serif", primaryColor: "#6366F1",
};

export const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
export const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

// ── BLOCK REGISTRY ─────────────────────────────────────────────────────────
export const BLOCK_DEFAULTS: Record<BlockType, { label: string; defaults: Record<string, any> }> = {
    text: { label: "Text", defaults: { content: "Write your text here…", fontSize: 16, align: "left", color: "#374151", fontWeight: "normal" } },
    image: { label: "Image", defaults: { src: "https://placehold.co/540x200/e2e8f0/94a3b8?text=Your+Image", alt: "Image", align: "center", width: "100%" } },
    button: { label: "Button", defaults: { text: "Click Here →", url: "#", backgroundColor: "#6366F1", color: "#ffffff", align: "center", borderRadius: 8, paddingV: 14, paddingH: 28 } },
    divider: { label: "Divider", defaults: { color: "#E5E7EB", thickness: 1 } },
    spacer: { label: "Spacer", defaults: { height: 32 } },
    social: { label: "Social", defaults: { align: "center", icons: [{ platform: "twitter", url: "#" }, { platform: "facebook", url: "#" }, { platform: "instagram", url: "#" }] } },
    hero: { label: "Hero", defaults: { headline: "Big Announcement!", subheadline: "Something amazing is coming.", bgColor: "#6366F1", textColor: "#ffffff" } },
    footer: { label: "Footer", defaults: { content: "© 2026 Company · Unsubscribe", fontSize: 12, color: "#9CA3AF", align: "center" } },
};

// ── ROW PRESETS ────────────────────────────────────────────────────────────
export type RowPresetKey = "1col" | "2col" | "3col" | "13_23" | "23_13";

export const ROW_PRESETS: Record<RowPresetKey, { label: string; widths: number[] }> = {
    "1col": { label: "1 Column", widths: [100] },
    "2col": { label: "2 Columns", widths: [50, 50] },
    "3col": { label: "3 Columns", widths: [33, 33, 34] },
    "13_23": { label: "1/3 + 2/3", widths: [33, 67] },
    "23_13": { label: "2/3 + 1/3", widths: [67, 33] },
};

export function createRowPreset(key: RowPresetKey): DesignRow {
    const p = ROW_PRESETS[key];
    return {
        id: `row-${uid()}`,
        settings: { backgroundColor: "#ffffff", paddingTop: 20, paddingBottom: 20 },
        columns: p.widths.map((w) => ({ id: `col-${uid()}`, width: w, blocks: [] })),
    };
}
