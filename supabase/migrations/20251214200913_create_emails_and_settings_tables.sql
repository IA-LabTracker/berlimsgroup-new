/*
  # Create B2B Cold Email Application Schema

  1. New Tables
    - `emails`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `company` (text) - Company name
      - `email` (text) - Contact email address
      - `region` (text) - Geographic region
      - `industry` (text) - Industry sector
      - `keywords` (text[]) - Search keywords used
      - `status` (text) - Email status: sent, replied, bounced
      - `response_content` (text) - Full reply content if available
      - `lead_classification` (text) - hot, warm, cold
      - `campaign_name` (text) - Optional campaign tag
      - `notes` (text) - User notes about the lead
      - `date_sent` (timestamptz) - When email was sent
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users, unique)
      - `webhook_url` (text) - n8n webhook URL
      - `email_template` (text) - Default email template
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
*/

-- Create emails table
CREATE TABLE IF NOT EXISTS emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company text NOT NULL,
  email text NOT NULL,
  region text NOT NULL,
  industry text NOT NULL,
  keywords text[] DEFAULT '{}',
  status text DEFAULT 'sent' CHECK (status IN ('sent', 'replied', 'bounced')),
  response_content text DEFAULT '',
  lead_classification text DEFAULT 'cold' CHECK (lead_classification IN ('hot', 'warm', 'cold')),
  campaign_name text DEFAULT '',
  notes text DEFAULT '',
  date_sent timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  webhook_url text DEFAULT '',
  email_template text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_emails_user_id ON emails(user_id);
CREATE INDEX IF NOT EXISTS idx_emails_status ON emails(status);
CREATE INDEX IF NOT EXISTS idx_emails_lead_classification ON emails(lead_classification);
CREATE INDEX IF NOT EXISTS idx_emails_date_sent ON emails(date_sent DESC);
CREATE INDEX IF NOT EXISTS idx_emails_campaign_name ON emails(campaign_name);
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);

-- Enable Row Level Security
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Policies for emails table
CREATE POLICY "Users can view own emails"
  ON emails FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own emails"
  ON emails FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own emails"
  ON emails FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own emails"
  ON emails FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for settings table
CREATE POLICY "Users can view own settings"
  ON settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings"
  ON settings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to update updated_at automatically
CREATE TRIGGER update_emails_updated_at BEFORE UPDATE ON emails
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();