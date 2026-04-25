import { HTMLAttributes, ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';

type InlineAlertVariant = 'info' | 'success' | 'warning' | 'danger';

interface InlineAlertProps extends HTMLAttributes<HTMLDivElement> {
    variant?: InlineAlertVariant;
    title?: string;
    description: ReactNode;
    action?: ReactNode;
    icon?: ReactNode;
}

const variantStyles: Record<InlineAlertVariant, string> = {
    info: 'border-[var(--info-border)] bg-[var(--info-bg)]/55 text-[var(--info)]',
    success: 'border-[var(--success-border)] bg-[var(--success-bg)]/55 text-[var(--success)]',
    warning: 'border-[var(--warning-border)] bg-[var(--warning-bg)]/55 text-[var(--warning)]',
    danger: 'border-[var(--danger-border)] bg-[var(--danger-bg)]/55 text-[var(--danger)]',
};

const variantIcons: Record<InlineAlertVariant, ReactNode> = {
    info: <Info className="h-4 w-4" />,
    success: <CheckCircle2 className="h-4 w-4" />,
    warning: <TriangleAlert className="h-4 w-4" />,
    danger: <AlertCircle className="h-4 w-4" />,
};

function InlineAlert({
    variant = 'info',
    title,
    description,
    action,
    icon,
    className = '',
    ...props
}: InlineAlertProps) {
    return (
        <div
            className={`flex flex-col gap-4 rounded-[var(--radius-lg)] border p-4 sm:flex-row sm:items-start sm:justify-between ${variantStyles[variant]} ${className}`}
            {...props}
        >
            <div className="flex gap-3">
                <div className="mt-0.5 flex-shrink-0">{icon ?? variantIcons[variant]}</div>
                <div>
                    {title && <p className="text-sm font-semibold">{title}</p>}
                    <div className={`text-sm leading-6 ${title ? 'mt-1' : ''}`}>{description}</div>
                </div>
            </div>
            {action && <div className="flex flex-shrink-0 items-center gap-2">{action}</div>}
        </div>
    );
}

export { InlineAlert };
