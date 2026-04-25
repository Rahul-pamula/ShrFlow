import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', label, error, helperText, icon, id, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={id}
                        className="block text-sm font-medium text-text-primary mb-1.5"
                    >
                        {label}
                    </label>
                )}

                <div className="relative">
                    {icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
                            {icon}
                        </div>
                    )}

                    <input
                        ref={ref}
                        id={id}
                        className={`
                            flex w-full rounded-lg border bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)]
                            ring-offset-[var(--bg-primary)] placeholder:text-[var(--text-muted)]
                            focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent
                            disabled:cursor-not-allowed disabled:opacity-50
                            ${error ? 'border-red-500 focus:ring-red-500' : 'border-[var(--border)]'}
                            ${icon ? 'pl-10' : ''}
                            ${className}
                        `}
                        {...props}
                    />
                </div>

                {error && (
                    <p className="mt-1.5 text-sm text-red-600">
                        {error}
                    </p>
                )}

                {helperText && !error && (
                    <p className="mt-1.5 text-sm text-text-tertiary">
                        {helperText}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export { Input };
