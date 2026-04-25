import { ReactNode } from 'react';

interface KeyValueItem {
    label: string;
    value: ReactNode;
    helper?: ReactNode;
}

interface KeyValueListProps {
    items: KeyValueItem[];
    columns?: 1 | 2 | 3;
}

function KeyValueList({ items, columns = 2 }: KeyValueListProps) {
    const columnClass = columns === 1 ? 'grid-cols-1' : columns === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2';

    return (
        <dl className={`grid gap-4 ${columnClass}`}>
            {items.map((item) => (
                <div key={item.label} className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-primary)] p-4">
                    <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">{item.label}</dt>
                    <dd className="mt-2 text-sm font-medium text-[var(--text-primary)]">{item.value}</dd>
                    {item.helper && <div className="mt-2 text-xs leading-5 text-[var(--text-muted)]">{item.helper}</div>}
                </div>
            ))}
        </dl>
    );
}

export { KeyValueList };
