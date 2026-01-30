import { useState, useEffect, FormEvent } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Save, AlertCircle, CheckCircle, Webhook, FileText, Linkedin } from "lucide-react";
import type { Settings as SettingsType } from "../types/database";

export function SettingsPage() {
  const { user } = useAuth();
  const [webhookUrl, setWebhookUrl] = useState("");
  const [linkedinWebhookUrl, setLinkedinWebhookUrl] = useState("");
  const [emailTemplate, setEmailTemplate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        const settings = data as SettingsType;
        setWebhookUrl(settings.webhook_url || "");
        setLinkedinWebhookUrl(settings.linkedin_webhook_url || "");
        setEmailTemplate(settings.email_template || "");
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      setStatus("error");
      setMessage("Failed to load settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("idle");
    setMessage("");
    setSaving(true);

    if (!user?.id) {
      setStatus("error");
      setMessage("User not found. Please log in again.");
      setSaving(false);
      return;
    }

    try {
      const settingsData = {
        user_id: user.id,
        webhook_url: webhookUrl,
        email_template: emailTemplate,
        linkedin_webhook_url: linkedinWebhookUrl,
      };

      // @ts-expect-error Supabase types don't resolve upsert for manually defined schemas
      const { error } = await supabase.from("settings").upsert(settingsData, {
        onConflict: "user_id",
      });

      if (error) throw error;

      setStatus("success");
      setMessage("Settings saved successfully!");

      setTimeout(() => {
        setStatus("idle");
        setMessage("");
      }, 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setStatus("error");
      setMessage("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">Configure your webhook URL and email templates</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {status === "success" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
            <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-800">
              <p className="font-medium">{message}</p>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">
              <p className="font-medium">{message}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <div className="flex items-center mb-6">
            <Webhook className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">n8n Webhook Configuration</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="webhookUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Webhook URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                id="webhookUrl"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                required
                placeholder="https://your-n8n-instance.com/webhook/..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-2 text-xs text-gray-500">
                Enter your n8n webhook URL. This is where search parameters will be sent when you
                trigger a campaign.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">
                How to get your webhook URL:
              </h3>
              <ol className="space-y-1 text-xs text-blue-800 list-decimal list-inside">
                <li>Open your n8n workflow editor</li>
                <li>Add a "Webhook" trigger node</li>
                <li>Set the HTTP Method to POST</li>
                <li>Copy the "Production URL" from the webhook node</li>
                <li>Paste it here</li>
              </ol>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Expected webhook payload:</h3>
              <pre className="text-xs text-gray-700 bg-white p-3 rounded border border-gray-200 overflow-x-auto">
                {`{
  "region": "Brazil",
  "industry": "Tech",
  "keywords": ["automation", "CRM"],
  "campaign": "Q4 Tech Outreach"
}`}
              </pre>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <div className="flex items-center mb-6">
            <FileText className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Email Template</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="emailTemplate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Default Email Template
              </label>
              <textarea
                id="emailTemplate"
                value={emailTemplate}
                onChange={(e) => setEmailTemplate(e.target.value)}
                rows={12}
                placeholder="Hi {{company}},

I noticed you're in the {{industry}} industry in {{region}}.

We specialize in helping companies like yours with...

Best regards,
Your Name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
              <p className="mt-2 text-xs text-gray-500">
                Create your default email template. You can use variables like {`{{company}}`},{" "}
                {`{{industry}}`}, and {`{{region}}`} which will be replaced with actual values.
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-yellow-900 mb-2">Available variables:</h3>
              <div className="grid grid-cols-2 gap-2 text-xs text-yellow-800">
                <div>
                  <code className="bg-white px-2 py-1 rounded border border-yellow-300">{`{{company}}`}</code>{" "}
                  - Company name
                </div>
                <div>
                  <code className="bg-white px-2 py-1 rounded border border-yellow-300">{`{{email}}`}</code>{" "}
                  - Recipient email
                </div>
                <div>
                  <code className="bg-white px-2 py-1 rounded border border-yellow-300">{`{{region}}`}</code>{" "}
                  - Region
                </div>
                <div>
                  <code className="bg-white px-2 py-1 rounded border border-yellow-300">{`{{industry}}`}</code>{" "}
                  - Industry
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <div className="flex items-center mb-6">
            <Linkedin className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">LinkedIn Campaign Webhook</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="linkedinWebhookUrl"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                LinkedIn Webhook URL
              </label>
              <input
                type="url"
                id="linkedinWebhookUrl"
                value={linkedinWebhookUrl}
                onChange={(e) => setLinkedinWebhookUrl(e.target.value)}
                placeholder="https://your-n8n-instance.com/webhook/linkedin-campaign"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-2 text-xs text-gray-500">
                n8n webhook URL that will receive LinkedIn campaign data (leads, template, account
                ID).
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Expected webhook payload:</h3>
              <pre className="text-xs text-gray-700 bg-white p-3 rounded border border-gray-200 overflow-x-auto">
                {`{
  "userId": "abc-123",
  "linkedinAccountId": "t5XY4yQzR9...",
  "leads": [
    { "firstName": "João", "company": "Google", ... }
  ],
  "messageTemplate": "Olá {{firstName}}...",
  "delaySeconds": 90,
  "campaignName": "My Campaign"
}`}
              </pre>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-blue-600 border border-transparent rounded-lg text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            <Save className="h-5 w-5 mr-2" />
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
