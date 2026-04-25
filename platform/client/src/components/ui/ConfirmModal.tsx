'use client';

import { ReactNode, useEffect, useRef, useCallback } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'primary';
    isLoading?: boolean;
    confirmDisabled?: boolean;
    children?: ReactNode;
}

function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Are you sure?',
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'danger',
    isLoading = false,
    confirmDisabled = false,
    children,
}: ConfirmModalProps) {

    const modalRef = useRef<HTMLDivElement>(null);
    const cancelBtnRef = useRef<HTMLButtonElement>(null);
    const triggerRef = useRef<HTMLElement | null>(null);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape' && !isLoading) {
            onClose();
            return;
        }

        if (e.key === 'Tab' && modalRef.current) {
            const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (focusableElements.length === 0) return;
            
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
            }
        }
    }, [onClose, isLoading]);

    useEffect(() => {
        if (isOpen) {
            triggerRef.current = document.activeElement as HTMLElement | null;
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
            
            // Prefer a user-input field when present so typed confirmations work naturally.
            const timeoutId = setTimeout(() => {
                const preferredInput = modalRef.current?.querySelector<HTMLElement>(
                    'input:not([disabled]), textarea:not([disabled]), select:not([disabled])'
                );
                if (preferredInput) {
                    preferredInput.focus();
                    if ('select' in preferredInput) {
                        try {
                            (preferredInput as HTMLInputElement).select?.();
                        } catch { }
                    }
                } else {
                    cancelBtnRef.current?.focus();
                }
            }, 10);
            return () => clearTimeout(timeoutId);
        } else {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
            
            // Restore focus
            if (triggerRef.current) {
                triggerRef.current.focus();
            }
        }
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
                onClick={!isLoading ? onClose : undefined}
                aria-hidden="true"
            />

            {/* Modal */}
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-modal-title"
                aria-describedby="confirm-modal-message"
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
                <div
                    ref={modalRef}
                    className="
                        bg-[var(--bg-card)] border border-[var(--border)]
                        rounded-[var(--radius-lg)] shadow-2xl w-full max-w-md
                        animate-fade-in
                    "
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-start gap-3 p-5 border-b border-[var(--border)]">
                        <div className={`
                            flex items-center justify-center h-10 w-10 rounded-full flex-shrink-0 mt-0.5
                            ${variant === 'danger' ? 'bg-[var(--danger-bg)]' : ''}
                            ${variant === 'warning' ? 'bg-[var(--warning-bg)]' : ''}
                            ${variant === 'primary' ? 'bg-blue-900/60' : ''}
                        `}>
                            <AlertTriangle
                                className={`h-5 w-5 ${variant === 'danger' ? 'text-[var(--danger)]' :
                                    variant === 'warning' ? 'text-[var(--warning)]' :
                                        'text-[var(--accent)]'
                                    }`}
                                aria-hidden="true"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3
                                id="confirm-modal-title"
                                className="text-sm font-semibold text-[var(--text-primary)]"
                            >
                                {title}
                            </h3>
                            <p id="confirm-modal-message" className="text-sm text-[var(--text-muted)] mt-1">
                                {message}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1 rounded flex-shrink-0"
                            aria-label="Close dialog"
                        >
                            <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                    </div>

                    {/* Optional extra content */}
                    {children && (
                        <div className="px-5 py-4 border-b border-[var(--border)]">
                            {children}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 p-4">
                        <Button
                            ref={cancelBtnRef}
                            variant="outline"
                            size="sm"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            {cancelLabel}
                        </Button>
                        <Button
                            variant={variant === 'warning' ? 'secondary' : variant}
                            size="sm"
                            onClick={onConfirm}
                            isLoading={isLoading}
                            disabled={confirmDisabled}
                        >
                            {confirmLabel}
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}

export { ConfirmModal };
