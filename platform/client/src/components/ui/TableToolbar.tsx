import { HTMLAttributes, ReactNode } from 'react';

interface TableToolbarProps extends HTMLAttributes<HTMLDivElement> {
    title?: string;
    description?: string;
    leading?: ReactNode;
    trailing?: ReactNode;
}

function TableToolbar({
    title,
    description,
    leading,
    trailing,
    className = '',
    children,
    ...props
}: TableToolbarProps) {
    return (
        <div
            className={`rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-4 ${className}`}
            {...props}
        >
            {(title || description || trailing) && (
                <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                        {title && <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>}
                        {description && <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p>}
                    </div>
                    {trailing && <div className="flex flex-wrap items-center gap-2">{trailing}</div>}
                </div>
            )}

            {leading && <div className="mb-3">{leading}</div>}
            {children}
        </div>
    );
}

export { TableToolbar };
