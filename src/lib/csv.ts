import type { LinkedInLead } from "../types/linkedin";

const REQUIRED_HEADERS = ["firstName", "lastName", "company", "position", "linkedinUrl"];

export function parseCSV(text: string): { leads: LinkedInLead[]; errors: string[] } {
  const errors: string[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    return { leads: [], errors: ["CSV must have a header row and at least one data row."] };
  }

  const headers = lines[0].split(",").map((h) => h.trim());
  const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));

  if (missing.length > 0) {
    return { leads: [], errors: [`Missing columns: ${missing.join(", ")}`] };
  }

  const headerIndex = Object.fromEntries(headers.map((h, i) => [h, i]));
  const leads: LinkedInLead[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());

    if (values.length < headers.length) {
      errors.push(`Row ${i + 1}: not enough columns (expected ${headers.length}, got ${values.length})`);
      continue;
    }

    const firstName = values[headerIndex["firstName"]];
    const linkedinUrl = values[headerIndex["linkedinUrl"]];

    if (!firstName || !linkedinUrl) {
      errors.push(`Row ${i + 1}: firstName and linkedinUrl are required`);
      continue;
    }

    leads.push({
      firstName,
      lastName: values[headerIndex["lastName"]] || "",
      company: values[headerIndex["company"]] || "",
      position: values[headerIndex["position"]] || "",
      linkedinUrl,
    });
  }

  return { leads, errors };
}
