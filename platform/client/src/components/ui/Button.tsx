import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
    // Base styles
    'inline-flex items-center justify-center gap-2 rounded-[var(--radius)] font-medium text-sm transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none',
    {
        variants: {
            variant: {
                primary: 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0',
                secondary: 'bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border border-[var(--border)]',
                outline: 'bg-transparent border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]',
                ghost: 'bg-transparent text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]',
                danger: 'bg-[var(--danger)] text-white hover:bg-red-700',
                success: 'bg-[var(--success)] text-white hover:bg-emerald-600',
                purple: 'bg-[var(--accent-purple)] text-white hover:bg-violet-600',
            },
            size: {
                sm: 'h-8 px-3 text-xs relative after:absolute after:left-1/2 after:top-1/2 after:h-[44px] after:w-[44px] after:-translate-x-1/2 after:-translate-y-1/2',
                md: 'h-10 px-4 text-sm',
                lg: 'h-12 px-6 text-base',
                icon: 'h-9 w-9 p-0 relative after:absolute after:left-1/2 after:top-1/2 after:h-[44px] after:w-[44px] after:-translate-x-1/2 after:-translate-y-1/2',
            },
        },
        defaultVariants: {
            variant: 'primary',
            size: 'md',
        },
    }
);

interface ButtonProps
    extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    isLoading?: boolean;
    fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant, size, isLoading, fullWidth, children, disabled, ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={`${buttonVariants({ variant, size })} ${fullWidth ? 'w-full' : ''} ${className}`}
                disabled={isLoading || disabled}
                aria-disabled={isLoading || disabled}
                {...props}
            >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
