"use client";

import { useCallback, useRef } from "react";
import { useReducer } from "react";
import {
    DesignJSON, DesignBlock, BlockType, SelectedNode,
    DEFAULT_THEME, DEFAULT_SETTINGS, BLOCK_DEFAULTS, uid, clone
} from "./types";

// ── ACTION TYPES ───────────────────────────────────────────────────────────
type Action =
    | { type: "PUSH_DESIGN"; modifier: (d: DesignJSON) => DesignJSON }
    | { type: "UNDO" }
    | { type: "REDO" };

interface StoreState {
    design: DesignJSON;
    history: DesignJSON[];
    future: DesignJSON[];
}

const initialDesign: DesignJSON = {
    theme: DEFAULT_THEME,
    settings: DEFAULT_SETTINGS,
    rows: [],
    headerBlocks: [],
    bodyBlocks: [],
    footerBlocks: [],
};

function reducer(state: StoreState, action: Action): StoreState {
    switch (action.type) {
        case "PUSH_DESIGN": {
            const next = action.modifier(clone(state.design));
            return {
                design: next,
                history: [...state.history, clone(state.design)].slice(-30),
                future: [],
            };
        }
        case "UNDO": {
            if (!state.history.length) return state;
            const prev = state.history[state.history.length - 1];
            return {
                design: prev,
                history: state.history.slice(0, -1),
                future: [clone(state.design), ...state.future],
            };
        }
        case "REDO": {
            if (!state.future.length) return state;
            const next = state.future[0];
            return {
                design: next,
                history: [...state.history, clone(state.design)],
                future: state.future.slice(1),
            };
        }
        default:
            return state;
    }
}

// ── ZONE KEY HELPER ────────────────────────────────────────────────────────
const zoneKey = (zone: string): "headerBlocks" | "bodyBlocks" | "footerBlocks" =>
    zone === "header" ? "headerBlocks" : zone === "footer" ? "footerBlocks" : "bodyBlocks";

// ── MAIN HOOK ──────────────────────────────────────────────────────────────
export function useDesignStore(initialJson?: DesignJSON) {
    const [state, dispatch] = useReducer(reducer, {
        design: initialJson || initialDesign,
        history: [],
        future: [],
    });

    // ── CORE MUTATION ──────────────────────────────────────────────────────
    const pushDesign = useCallback((modifier: (d: DesignJSON) => DesignJSON) => {
        dispatch({ type: "PUSH_DESIGN", modifier });
    }, []);

    const loadDesign = useCallback((json: DesignJSON) => {
        dispatch({ type: "PUSH_DESIGN", modifier: () => json });
    }, []);

    // ── UNDO / REDO ────────────────────────────────────────────────────────
    const undo = useCallback(() => dispatch({ type: "UNDO" }), []);
    const redo = useCallback(() => dispatch({ type: "REDO" }), []);
    const canUndo = state.history.length > 0;
    const canRedo = state.future.length > 0;

    // ── BLOCK OPERATIONS ───────────────────────────────────────────────────
    const addBlockToZone = useCallback((
        zone: "header" | "body" | "footer",
        blockType: BlockType = "text",
        customProps?: Record<string, any>,
        destIndex?: number
    ) => {
        const newId = `blk-${uid()}`;
        const defaults = BLOCK_DEFAULTS[blockType]?.defaults ?? {};
        const newBlock: DesignBlock = {
            id: newId,
            type: blockType,
            props: { ...defaults, ...customProps },
        };
        pushDesign(d => {
            const key = zoneKey(zone);
            if (typeof destIndex === "number") {
                d[key].splice(destIndex, 0, newBlock);
            } else {
                d[key].push(newBlock);
            }
            return d;
        });
        return newId; // caller can auto-select
    }, [pushDesign]);

    const moveBlock = useCallback((
        blockId: string,
        sourceZone: string,
        destZone: string,
        destIndex?: number
    ) => {
        pushDesign(d => {
            const sKey = zoneKey(sourceZone);
            const dKey = zoneKey(destZone);
            const srcIdx = d[sKey].findIndex(b => b.id === blockId);
            if (srcIdx === -1) return d;
            const [moved] = d[sKey].splice(srcIdx, 1);
            const finalIdx = typeof destIndex === "number"
                ? Math.min(destIndex, d[dKey].length)
                : d[dKey].length;
            d[dKey].splice(finalIdx, 0, moved);
            return d;
        });
    }, [pushDesign]);

    const duplicateBlock = useCallback((blockId: string) => {
        let newId = "";
        pushDesign(d => {
            const zones: (keyof Pick<DesignJSON, "headerBlocks" | "bodyBlocks" | "footerBlocks">)[] =
                ["headerBlocks", "bodyBlocks", "footerBlocks"];
            for (const key of zones) {
                const idx = d[key].findIndex(b => b.id === blockId);
                if (idx !== -1) {
                    newId = `blk-${uid()}`;
                    d[key].splice(idx + 1, 0, { ...clone(d[key][idx]), id: newId });
                    break;
                }
            }
            return d;
        });
        return newId;
    }, [pushDesign]);

    const deleteBlock = useCallback((blockId: string) => {
        pushDesign(d => {
            d.headerBlocks = d.headerBlocks.filter(b => b.id !== blockId);
            d.bodyBlocks = d.bodyBlocks.filter(b => b.id !== blockId);
            d.footerBlocks = d.footerBlocks.filter(b => b.id !== blockId);
            return d;
        });
    }, [pushDesign]);

    const updateBlockProp = useCallback((blockId: string, key: string, val: any) => {
        pushDesign(d => {
            if (blockId === "design" && key === "theme") { d.theme = val; return d; }
            const all = [...d.headerBlocks, ...d.bodyBlocks, ...d.footerBlocks];
            const block = all.find(b => b.id === blockId);
            if (block) block.props[key] = val;
            return d;
        });
    }, [pushDesign]);

    const bulkUpdateBlock = useCallback((
        blockId: string,
        updates: Record<string, any>,
        newType?: BlockType
    ) => {
        pushDesign(d => {
            const all = [...d.headerBlocks, ...d.bodyBlocks, ...d.footerBlocks];
            const block = all.find(b => b.id === blockId);
            if (block) {
                if (newType) block.type = newType;
                Object.assign(block.props, updates);
            }
            return d;
        });
    }, [pushDesign]);

    const updateTheme = useCallback((key: string, val: any) => {
        pushDesign(d => { (d.theme as any)[key] = val; return d; });
    }, [pushDesign]);

    const updateSetting = useCallback((
        section: keyof typeof DEFAULT_SETTINGS,
        key: string,
        value: any
    ) => {
        pushDesign(d => {
            if (!d.settings) d.settings = clone(DEFAULT_SETTINGS);
            (d.settings[section] as any)[key] = value;
            return d;
        });
    }, [pushDesign]);

    return {
        // State
        design: state.design,
        canUndo,
        canRedo,

        // Core
        pushDesign,
        loadDesign,
        undo,
        redo,

        // Block operations
        addBlockToZone,
        moveBlock,
        duplicateBlock,
        deleteBlock,
        updateBlockProp,
        bulkUpdateBlock,

        // Theme / Settings
        updateTheme,
        updateSetting,
    };
}
