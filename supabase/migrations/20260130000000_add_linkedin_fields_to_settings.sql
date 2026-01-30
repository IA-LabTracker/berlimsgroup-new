ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS linkedin_account_id TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_webhook_url TEXT;
