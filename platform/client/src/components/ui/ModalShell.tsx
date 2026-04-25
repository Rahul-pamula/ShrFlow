import { HTMLAttributes, ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalShellProps extends HTMLAttributes<HTMLDivElement> {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    maxWidthClass?: string;
    headerAction?: ReactNode;
}

function ModalShell({
    isOpen,
    onClose,
    title,
    description,
    maxWidthClass = 'max-w-lg',
    headerAction,
    className = '',
    children,
    ...props
}: ModalShellProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div
                className={`w-full ${maxWidthClass} max-h-[80vh] overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl ${className}`}
                {...props}
            >
                <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-6 py-5">
                    <div>
                        <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
                        {description && <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                        {headerAction}
                        <button
                            onClick={onClose}
                            className="rounded-[var(--radius)] p-1 text-[var(--text-muted)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                            aria-label="Close dialog"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>
                <div className="px-6 py-5">
                    {children}
                </div>
            </div>
        </div>
    );
}

export { ModalShell };
