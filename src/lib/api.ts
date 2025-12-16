import axios from "axios";

const INITIAL_EMAIL_WEBHOOK = import.meta.env.VITE_WEBHOOK_N8N || "";

export async function triggerInitialEmails(emails: string[]) {
  const { data } = await axios.post(INITIAL_EMAIL_WEBHOOK, { emails });
  return data;
}
