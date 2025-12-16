import axios from 'axios';

const INITIAL_EMAIL_WEBHOOK = 'https://your-n8n-instance.com/webhook/send-initial-email';

export async function triggerInitialEmails(emails: string[]) {
  const { data } = await axios.post(INITIAL_EMAIL_WEBHOOK, { emails });
  return data;
}
