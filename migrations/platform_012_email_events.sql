-- Phase 6: Email Events table for opens/clicks/bounces/spam
create table if not exists email_events (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid not null,
    campaign_id uuid not null,
    dispatch_id uuid not null,
    contact_id uuid,
    event_type text not null, -- open | click | bounce | spam | unsubscribe
    url text,
    user_agent text,
    ip_address text,
    is_bot boolean default false,
    created_at timestamptz not null default now()
);

create index if not exists idx_email_events_tenant on email_events(tenant_id);
create index if not exists idx_email_events_campaign on email_events(campaign_id);
create index if not exists idx_email_events_dispatch on email_events(dispatch_id);
create index if not exists idx_email_events_contact on email_events(contact_id);
create index if not exists idx_email_events_event_type on email_events(event_type);
create index if not exists idx_email_events_created_at on email_events(created_at);
