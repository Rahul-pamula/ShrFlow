import { Badge } from './Badge';

export type CampaignStatus =
    | 'draft' | 'scheduled' | 'processing' | 'completed'
    | 'paused' | 'failed' | 'throttled' | 'cancelled'
    | 'sending' | 'sent' | 'archived'
    | 'active' | 'inactive' | 'bounced' | 'unsubscribed'
    | 'subscribed' | 'verified' | 'pending' | 'suspended';

const statusConfig: Record<CampaignStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' | 'outline' }> = {
    // Contact statuses
    subscribed: { label: 'Subscribed', variant: 'success' },
    unsubscribed: { label: 'Unsubscribed', variant: 'warning' },
    bounced: { label: 'Bounced', variant: 'danger' },
    inactive: { label: 'Inactive', variant: 'outline' },

    // Campaign statuses
    draft: { label: 'Draft', variant: 'outline' },
    scheduled: { label: 'Scheduled', variant: 'info' },
    processing: { label: 'Sending...', variant: 'info' },
    sending: { label: 'Sending', variant: 'info' },
    throttled: { label: '⏳ Throttled', variant: 'warning' },
    completed: { label: 'Completed', variant: 'success' },
    sent: { label: 'Sent', variant: 'success' },
    paused: { label: 'Paused', variant: 'warning' },
    failed: { label: 'Failed', variant: 'danger' },
    cancelled: { label: 'Cancelled', variant: 'outline' },
    archived: { label: 'Archived', variant: 'outline' },

    // Domain / plan statuses
    verified: { label: 'Verified', variant: 'success' },
    pending: { label: 'Pending', variant: 'warning' },
    active: { label: 'Active', variant: 'success' },
    suspended: { label: '⛔ Suspended', variant: 'danger' },
};

interface StatusBadgeProps {
    status: CampaignStatus;
    className?: string;
}

function StatusBadge({ status, className = '' }: StatusBadgeProps) {
    const config = statusConfig[status] ?? { label: status, variant: 'default' as const };
    return (
        <Badge variant={config.variant} className={className}>
            {config.label}
        </Badge>
    );
}

export { StatusBadge, statusConfig };
