-- Phase 6 extension: classify email_events by source
alter table email_events
    add column if not exists source text default 'unknown';

-- Backfill existing data: mark human vs unknown based on is_bot flag
update email_events
   set source = case when is_bot = false then 'human' else 'unknown' end
 where source = 'unknown' or source is null;

create index if not exists idx_email_events_campaign_source_event
    on email_events(campaign_id, source, event_type);
