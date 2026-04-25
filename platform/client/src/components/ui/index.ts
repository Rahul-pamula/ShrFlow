/**
 * Email Engine Design System — Central export barrel
 *
 * Usage: import { Button, StatCard, useToast } from '@/components/ui';
 *
 * ATOMS — Single purpose
 */
export { Button, buttonVariants } from './Button';
export { Badge, badgeVariants } from './Badge';
export { HealthDot } from './HealthDot';
export { LoadingSpinner, PageLoader } from './LoadingSpinner';
export { Input } from './Input';
export { Card } from './Card';

/**
 * MOLECULES — Combined atoms
 */
export { StatCard } from './StatCard';
export { StatusBadge, statusConfig } from './StatusBadge';
export { ConfirmModal } from './ConfirmModal';
export { ToastProvider, useToast } from './Toast';

/**
 * ORGANISMS — Full sections
 */
export { PageHeader } from './PageHeader';
export { DataTable } from './DataTable';
export { EmptyState } from './EmptyState';
export { Breadcrumb } from './Breadcrumb';
export { SectionCard } from './SectionCard';
export { InlineAlert } from './InlineAlert';
export { FilterBar } from './FilterBar';
export { KeyValueList } from './KeyValueList';
export { TableToolbar } from './TableToolbar';
export { InspectorPanel } from './InspectorPanel';
export { ModalShell } from './ModalShell';

/**
 * Type exports
 */
export type { HealthDotProps } from './HealthDot';
export type { CampaignStatus } from './StatusBadge';
export type { BreadcrumbItem } from './Breadcrumb';
export type { Column, DataTableProps } from './DataTable';
export type { ToastVariant } from './Toast';
