'use client';

import { ReactNode } from 'react';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    action?: ReactNode;        // e.g. <Button>Import</Button>
    breadcrumb?: ReactNode;    // pass <Breadcrumb> component
}

function PageHeader({ title, subtitle, action, breadcrumb }: PageHeaderProps) {
    return (
        <div className="flex items-start justify-between gap-4 mb-6">
            <div className="min-w-0">
                {breadcrumb && (
                    <div className="mb-1">{breadcrumb}</div>
                )}
                <h1 className="text-[var(--text-h1)] font-bold text-[var(--text-primary)] truncate leading-none mt-0">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-sm text-[var(--text-muted)] mt-1">{subtitle}</p>
                )}
            </div>
            {action && (
                <div className="flex items-center gap-2 flex-shrink-0">
                    {action}
                </div>
            )}
        </div>
    );
}

export { PageHeader };
