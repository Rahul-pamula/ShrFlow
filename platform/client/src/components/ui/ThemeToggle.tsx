"use client";

/**
 * ThemeToggle
 *
 * Cycles: system → light → dark → system
 *
 * Security:
 *   - Never passes user input directly to setTheme.
 *     The next value is always derived from a strict lookup table.
 * Accessibility:
 *   - role="button", aria-label, keyboard support (Enter / Space).
 */

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const VALID_THEMES = ["light", "dark", "system"] as const;
type ValidTheme = typeof VALID_THEMES[number];

const NEXT_THEME: Record<ValidTheme, ValidTheme> = {
    system: "light",
    light: "dark",
    dark: "system",
};

const ICON: Record<ValidTheme, React.ReactNode> = {
    light: <Sun size={16} strokeWidth={2} aria-hidden="true" />,
    dark: <Moon size={16} strokeWidth={2} aria-hidden="true" />,
    system: <Monitor size={16} strokeWidth={2} aria-hidden="true" />,
};

const LABEL: Record<ValidTheme, string> = {
    light: "Light mode — click to switch to dark",
    dark: "Dark mode — click to switch to system",
    system: "System mode — click to switch to light",
};

interface ThemeToggleProps {
    /** Optional extra class names for the button container */
    className?: string;
    /** Show a text label alongside the icon */
    showLabel?: boolean;
}

export function ThemeToggle({ className = "", showLabel = false }: ThemeToggleProps) {
    const { theme, resolvedTheme } = useTheme();
    const { setThemePref } = useAuth();
    const [mounted, setMounted] = useState(false);

    // Only render after mount to avoid SSR hydration mismatch
    useEffect(() => setMounted(true), []);
    if (!mounted) {
        // Render an invisible placeholder to preserve layout space
        return (
            <div
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 opacity-0 ${className}`}
                aria-hidden="true"
                style={{ width: showLabel ? "6.5rem" : "2.25rem", height: "2.25rem" }}
            />
        );
    }

    // Strictly validate the current theme — never trust raw values
    const safeTheme: ValidTheme = VALID_THEMES.includes(theme as ValidTheme)
        ? (theme as ValidTheme)
        : "system";

    const handleToggle = () => {
        const next = NEXT_THEME[safeTheme];
        // Explicit whitelist check
        if (VALID_THEMES.includes(next)) {
            setThemePref(next);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleToggle();
        }
    };

    return (
        <button
            id="theme-toggle-btn"
            type="button"
            role="button"
            tabIndex={0}
            aria-label={LABEL[safeTheme]}
            title={LABEL[safeTheme]}
            onClick={handleToggle}
            onKeyDown={handleKeyDown}
            className={[
                "inline-flex items-center gap-1.5",
                "rounded-lg px-2.5 py-1.5",
                "border border-[var(--border)]",
                "bg-[var(--bg-card)] text-[var(--text-muted)]",
                "hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]",
                "transition-all duration-200 ease-out",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1",
                "select-none cursor-pointer",
                className,
            ]
                .filter(Boolean)
                .join(" ")}
        >
            <span
                className="transition-transform duration-300"
                style={{
                    transform:
                        resolvedTheme === "dark"
                            ? "rotate(12deg)"
                            : "rotate(0deg)",
                }}
            >
                {ICON[safeTheme]}
            </span>
            {showLabel && (
                <span className="text-xs font-medium capitalize">{safeTheme}</span>
            )}
        </button>
    );
}
