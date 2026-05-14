import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
    label: string;
    value: string | number;
    trend?: number;               // +12 means ↑12%, -5 means ↓5%
    trendLabel?: string;          // "vs last month"
    icon?: ReactNode;
    className?: string;
    key?: string | number;
}

function StatCard({ label, value, trend, trendLabel, icon, className = '' }: StatCardProps) {
    const trendColor =
        trend === undefined ? '' :
            trend > 0 ? 'text-[var(--success)]' :
                trend < 0 ? 'text-[var(--danger)]' :
                    'text-[var(--text-muted)]';

    const TrendIcon =
        trend === undefined ? null :
            trend > 0 ? TrendingUp :
                trend < 0 ? TrendingDown :
                    Minus;

    return (
        <div
            className={`
                bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5
                hover:bg-[var(--bg-hover)] transition-colors duration-150
                ${className}
            `}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wide mb-1">
                        {label}
                    </p>
                    <p className="text-2xl font-bold text-[var(--text-primary)] leading-none">
                        {value}
                    </p>
                    {trend !== undefined && (
                        <div className={`flex items-center gap-1 mt-2 ${trendColor}`}>
                            {TrendIcon && <TrendIcon className="h-3.5 w-3.5" aria-hidden="true" />}
                            <span className="text-xs font-medium">
                                {trend > 0 ? '+' : ''}{trend}%
                                {trendLabel && <span className="text-[var(--text-muted)] ml-1">{trendLabel}</span>}
                            </span>
                        </div>
                    )}
                </div>
                {icon && (
                    <div className="text-[var(--text-muted)] flex-shrink-0 mt-0.5" aria-hidden="true">
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
}

export { StatCard };
