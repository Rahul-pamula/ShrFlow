"use client";

import { create } from "zustand";
import { 
    DesignJSON, DesignBlock, BlockType, SelectedNode,
    DEFAULT_THEME, DEFAULT_SETTINGS, BLOCK_DEFAULTS, uid, clone 
} from "@/app/templates/[id]/block/types";

interface EditorState {
    // State
    design: DesignJSON;
    history: DesignJSON[];
    future: DesignJSON[];
    selectedNode: SelectedNode | null;
    hoveredBlockId: string | null;
    viewMode: "desktop" | "mobile";
    validationErrors: Record<string, string[]>;
    
    // Core Actions
    setDesign: (design: DesignJSON) => void;
    pushDesign: (modifier: (d: DesignJSON) => DesignJSON) => void;
    undo: () => void;
    redo: () => void;
    
    // Selection Actions
    selectNode: (node: SelectedNode | null) => void;
    setHoveredBlockId: (id: string | null) => void;
    setViewMode: (mode: "desktop" | "mobile") => void;
    setValidationErrors: (errors: Record<string, string[]>) => void;
    
    // Block Operations
    addBlock: (zone: "header" | "body" | "footer", type: BlockType, props?: any, index?: number) => string;
    updateBlock: (id: string, updates: Record<string, any>) => void;
    updateBlockProp: (id: string, key: string, val: any) => void;
    bulkUpdateBlock: (id: string, updates: Record<string, any>) => void;
    moveBlock: (id: string, sourceZone: string, destZone: string, destIndex?: number) => void;
    duplicateBlock: (id: string) => string;
    deleteBlock: (id: string) => void;
    
    // Theme & Settings
    updateTheme: (key: string, val: any) => void;
    updateSetting: (section: string, key: string, val: any) => void;
}

const initialDesign: DesignJSON = {
    theme: DEFAULT_THEME,
    settings: DEFAULT_SETTINGS,
    rows: [],
    headerBlocks: [],
    bodyBlocks: [],
    footerBlocks: [],
};

const zoneKey = (zone: string): "headerBlocks" | "bodyBlocks" | "footerBlocks" =>
    zone === "header" ? "headerBlocks" : zone === "footer" ? "footerBlocks" : "bodyBlocks";

export const useEditorStore = create<EditorState>((set, get) => ({
    // Initial State
    design: initialDesign,
    history: [],
    future: [],
    selectedNode: null,
    hoveredBlockId: null,
    viewMode: "desktop",
    validationErrors: {},

    // Core Actions
    setDesign: (design) => set({ design, history: [], future: [] }),
    
    pushDesign: (modifier) => {
        const { design, history } = get();
        const next = modifier(clone(design));
        set({
            design: next,
            history: [...history, clone(design)].slice(-30),
            future: [],
        });
    },

    undo: () => {
        const { design, history, future } = get();
        if (history.length === 0) return;
        
        const prev = history[history.length - 1];
        set({
            design: prev,
            history: history.slice(0, -1),
            future: [clone(design), ...future],
        });
    },

    redo: () => {
        const { design, history, future } = get();
        if (future.length === 0) return;
        
        const next = future[0];
        set({
            design: next,
            history: [...history, clone(design)],
            future: future.slice(1),
        });
    },

    // Selection Actions
    selectNode: (selectedNode) => set({ selectedNode }),
    setHoveredBlockId: (hoveredBlockId) => set({ hoveredBlockId }),
    setViewMode: (viewMode) => set({ viewMode }),
    setValidationErrors: (validationErrors) => set({ validationErrors }),

    // Block Operations
    addBlock: (zone, type, customProps = {}, destIndex) => {
        const newId = `blk-${uid()}`;
        const defaults = BLOCK_DEFAULTS[type]?.defaults ?? {};
        const newBlock: DesignBlock = {
            id: newId,
            type,
            props: { ...defaults, ...customProps },
        };

        const { design, history } = get();
        const next = clone(design);
        const key = zoneKey(zone);
        
        if (typeof destIndex === "number") {
            next[key].splice(destIndex, 0, newBlock);
        } else {
            next[key].push(newBlock);
        }

        set({
            design: next,
            history: [...history, clone(design)].slice(-30),
            future: [],
            selectedNode: { type: "block", id: newId }
        });

        return newId;
    },

    updateBlock: (id, updates) => {
        const { design, history } = get();
        const next = clone(design);
        
        const all = [...next.headerBlocks, ...next.bodyBlocks, ...next.footerBlocks];
        const block = all.find(b => b.id === id);
        if (block) {
            Object.assign(block.props, updates);
            set({
                design: next,
                history: [...history, clone(design)].slice(-30),
                future: [],
            });
        }
    },

    updateBlockProp: (id, key, val) => {
        const { design, history } = get();
        const next = clone(design);
        const all = [...next.headerBlocks, ...next.bodyBlocks, ...next.footerBlocks];
        const block = all.find(b => b.id === id);
        if (block) {
            block.props[key] = val;
            set({ design: next, history: [...history, clone(design)].slice(-30), future: [] });
        }
    },

    bulkUpdateBlock: (id, updates) => {
        const { design, history } = get();
        const next = clone(design);
        const all = [...next.headerBlocks, ...next.bodyBlocks, ...next.footerBlocks];
        const block = all.find(b => b.id === id);
        if (block) {
            Object.assign(block.props, updates);
            set({ design: next, history: [...history, clone(design)].slice(-30), future: [] });
        }
    },

    moveBlock: (id, sourceZone, destZone, destIndex) => {
        const { design, history } = get();
        const next = clone(design);
        
        const sKey = zoneKey(sourceZone);
        const dKey = zoneKey(destZone);
        
        const srcIdx = next[sKey].findIndex(b => b.id === id);
        if (srcIdx === -1) return;
        
        const [moved] = next[sKey].splice(srcIdx, 1);
        const finalIdx = typeof destIndex === "number"
            ? Math.min(destIndex, next[dKey].length)
            : next[dKey].length;
            
        next[dKey].splice(finalIdx, 0, moved);

        set({
            design: next,
            history: [...history, clone(design)].slice(-30),
            future: [],
        });
    },

    duplicateBlock: (id) => {
        const { design, history } = get();
        const next = clone(design);
        let newId = "";

        const zones: (keyof Pick<DesignJSON, "headerBlocks" | "bodyBlocks" | "footerBlocks">)[] =
            ["headerBlocks", "bodyBlocks", "footerBlocks"];
            
        for (const key of zones) {
            const idx = next[key].findIndex(b => b.id === id);
            if (idx !== -1) {
                newId = `blk-${uid()}`;
                next[key].splice(idx + 1, 0, { ...clone(next[key][idx]), id: newId });
                break;
            }
        }

        if (newId) {
            set({
                design: next,
                history: [...history, clone(design)].slice(-30),
                future: [],
                selectedNode: { type: "block", id: newId }
            });
        }
        
        return newId;
    },

    deleteBlock: (id) => {
        const { design, history, selectedNode } = get();
        const next = clone(design);
        
        next.headerBlocks = next.headerBlocks.filter(b => b.id !== id);
        next.bodyBlocks = next.bodyBlocks.filter(b => b.id !== id);
        next.footerBlocks = next.footerBlocks.filter(b => b.id !== id);

        set({
            design: next,
            history: [...history, clone(design)].slice(-30),
            future: [],
            selectedNode: selectedNode?.id === id ? null : selectedNode
        });
    },

    updateTheme: (key, val) => {
        const { design, history } = get();
        const next = clone(design);
        (next.theme as any)[key] = val;
        
        set({
            design: next,
            history: [...history, clone(design)].slice(-30),
            future: [],
        });
    },

    updateSetting: (section, key, val) => {
        const { design, history } = get();
        const next = clone(design);
        if (!next.settings) next.settings = clone(DEFAULT_SETTINGS);
        (next.settings as any)[section][key] = val;
        
        set({
            design: next,
            history: [...history, clone(design)].slice(-30),
            future: [],
        });
    }
}));
