export type EmailStatus = 'sent' | 'replied' | 'bounced';
export type LeadClassification = 'hot' | 'warm' | 'cold';

export interface Email {
  id: string;
  user_id: string;
  company: string;
  email: string;
  region: string;
  industry: string;
  keywords: string[];
  status: EmailStatus;
  response_content: string;
  lead_classification: LeadClassification;
  campaign_name: string;
  notes: string;
  date_sent: string;
  created_at: string;
  updated_at: string;
}

export interface Settings {
  id: string;
  user_id: string;
  webhook_url: string;
  email_template: string;
  linkedin_account_id: string | null;
  linkedin_webhook_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      emails: {
        Row: Email;
        Insert: Omit<Email, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Email, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
      settings: {
        Row: Settings;
        Insert: Omit<Settings, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Settings, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
