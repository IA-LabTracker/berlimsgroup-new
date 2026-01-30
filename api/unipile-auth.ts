import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.UNIPILE_API_KEY;
  const dsn = process.env.UNIPILE_DSN;

  if (!apiKey || !dsn) {
    return res.status(500).json({ error: "Unipile not configured" });
  }

  const { success_redirect_url, failure_redirect_url } = req.body ?? {};

  try {
    const response = await fetch(`https://${dsn}/api/v1/hosted/accounts/link`, {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        type: "create",
        api_url: `https://${dsn}`,
        providers: ["LINKEDIN"],
        expiresOn: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        success_redirect_url,
        failure_redirect_url,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).json({ error });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error("Unipile auth error:", err);
    return res.status(500).json({ error: "Failed to create auth link" });
  }
}
