-- Migration 014: Add Sender Identity to Campaigns

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS from_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS from_prefix VARCHAR(100),
  ADD COLUMN IF NOT EXISTS domain_id UUID REFERENCES domains(id) ON DELETE SET NULL;
