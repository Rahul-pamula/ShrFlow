import { HTMLAttributes, ReactNode } from 'react';

type SectionCardTone = 'default' | 'subtle' | 'success' | 'warning' | 'danger';

interface SectionCardProps extends HTMLAttributes<HTMLDivElement> {
    title?: string;
    description?: string;
    action?: ReactNode;
    footer?: ReactNode;
    tone?: SectionCardTone;
    noPadding?: boolean;
}

const toneClasses: Record<SectionCardTone, string> = {
    default: 'border-[var(--border)] bg-[var(--bg-card)]',
    subtle: 'border-[var(--border)] bg-[var(--bg-primary)]',
    success: 'border-[var(--success-border)] bg-[var(--success-bg)]/40',
    warning: 'border-[var(--warning-border)] bg-[var(--warning-bg)]/40',
    danger: 'border-[var(--danger-border)] bg-[var(--danger-bg)]/40',
};

function SectionCard({
    title,
    description,
    action,
    footer,
    tone = 'default',
    noPadding = false,
    className = '',
    children,
    ...props
}: SectionCardProps) {
    return (
        <section
            className={`overflow-hidden rounded-[var(--radius-lg)] border ${toneClasses[tone]} ${className}`}
            {...props}
        >
            {(title || description || action) && (
                <div className={`flex flex-col gap-4 ${noPadding ? 'p-0' : 'p-6'}`}>
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                            {title && <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>}
                            {description && <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{description}</p>}
                        </div>
                        {action && <div className="flex flex-shrink-0 items-center gap-2">{action}</div>}
                    </div>
                    {children && <div>{children}</div>}
                </div>
            )}

            {!title && !description && !action && children && (
                <div className={noPadding ? '' : 'p-6'}>
                    {children}
                </div>
            )}

            {footer && <div className="border-t border-[var(--border)] bg-[var(--bg-hover)] px-6 py-4">{footer}</div>}
        </section>
    );
}

export { SectionCard };
