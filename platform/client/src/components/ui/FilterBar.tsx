import { HTMLAttributes, ReactNode } from 'react';

interface FilterBarProps extends HTMLAttributes<HTMLDivElement> {
    leading?: ReactNode;
    trailing?: ReactNode;
}

function FilterBar({ leading, trailing, className = '', children, ...props }: FilterBarProps) {
    return (
        <div
            className={`flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-3 lg:flex-row lg:items-center lg:justify-between ${className}`}
            {...props}
        >
            <div className="flex min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:items-center">
                {leading}
                {children}
            </div>
            {trailing && <div className="flex flex-wrap items-center gap-2">{trailing}</div>}
        </div>
    );
}

export { FilterBar };
