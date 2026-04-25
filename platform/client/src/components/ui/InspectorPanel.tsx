import { HTMLAttributes, ReactNode } from 'react';

interface InspectorPanelProps extends HTMLAttributes<HTMLDivElement> {
    title?: string;
    subtitle?: string;
    badge?: ReactNode;
    action?: ReactNode;
}

function InspectorPanel({
    title,
    subtitle,
    badge,
    action,
    className = '',
    children,
    ...props
}: InspectorPanelProps) {
    return (
        <aside
            className={`space-y-6 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-6 ${className}`}
            {...props}
        >
            {(title || subtitle || badge || action) && (
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                        {(title || badge) && (
                            <div className="mb-2 flex flex-wrap items-center gap-3">
                                {title && <h2 className="text-2xl font-semibold text-[var(--text-primary)]">{title}</h2>}
                                {badge}
                            </div>
                        )}
                        {subtitle && <p className="text-sm leading-6 text-[var(--text-muted)]">{subtitle}</p>}
                    </div>
                    {action && <div className="flex flex-shrink-0 items-center gap-2">{action}</div>}
                </div>
            )}
            {children}
        </aside>
    );
}

export { InspectorPanel };
