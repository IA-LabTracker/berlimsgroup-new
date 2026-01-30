export interface LinkedInLead {
  firstName: string;
  lastName: string;
  company: string;
  position: string;
  linkedinUrl: string;
}

export interface LinkedInCampaignPayload {
  userId: string;
  linkedinAccountId: string;
  leads: LinkedInLead[];
  messageTemplate: string;
  delaySeconds: number;
  campaignName: string;
}
