import React, { HTMLAttributes, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
    'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
    {
        variants: {
            variant: {
                default: 'bg-[var(--bg-hover)] text-[var(--text-primary)]',
                success: 'bg-[var(--success-bg)] text-[var(--success)]',
                warning: 'bg-[var(--warning-bg)] text-[var(--warning)]',
                danger: 'bg-[var(--danger-bg)] text-[var(--danger)]',
                info: 'bg-[var(--info-bg)] text-[var(--info)]',
                accent: 'bg-[var(--accent)] text-white',
                purple: 'bg-purple-900/60 text-[var(--accent-purple)]',
                outline: 'border border-[var(--border)] text-[var(--text-muted)]',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
);

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'purple' | 'outline';
    children?: ReactNode;
    className?: string;
}

function Badge({ className = '', variant, children, ...props }: BadgeProps) {
    return (
        <span className={`${badgeVariants({ variant })} ${className}`} {...props}>
            {children}
        </span>
    );
}

export { Badge, badgeVariants };
