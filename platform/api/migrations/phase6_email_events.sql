-- Phase 6: email_events table
-- Tracks all open, click, bounce, spam, and unsubscribe events per dispatch

CREATE TABLE IF NOT EXISTS email_events (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    campaign_id    UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    dispatch_id    UUID REFERENCES campaign_dispatch(id) ON DELETE SET NULL,
    contact_id     UUID REFERENCES contacts(id) ON DELETE SET NULL,

    event_type     TEXT NOT NULL CHECK (event_type IN ('open', 'click', 'bounce', 'unsubscribe', 'spam')),
    url            TEXT,                       -- for click events: destination URL
    ip_address     TEXT,
    user_agent     TEXT,
    is_bot         BOOLEAN DEFAULT FALSE,      -- bot-filtered open/click events

    created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast analytics queries
CREATE INDEX IF NOT EXISTS idx_email_events_campaign ON email_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_events_tenant   ON email_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_events_dispatch ON email_events(dispatch_id);
CREATE INDEX IF NOT EXISTS idx_email_events_type     ON email_events(event_type);
CREATE INDEX IF NOT EXISTS idx_email_events_bot      ON email_events(is_bot);
