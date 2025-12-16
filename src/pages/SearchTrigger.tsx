import { useState, useEffect, FormEvent } from "react";
import { supabase } from "../lib/supabase";
import axios from "axios";
import { Search, Send, CheckCircle, AlertCircle, Loader } from "lucide-react";

export function SearchTrigger() {
  const [region, setRegion] = useState("");
  const [industry, setIndustry] = useState("");
  const [keywords, setKeywords] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "running" | "completed" | "error">("idle");
  const [message, setMessage] = useState("");
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoadingSettings(true);
      const { data, error } = await (supabase as any)
        .from("settings")
        .select("webhook_url")
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data?.webhook_url) {
        setWebhookUrl(data.webhook_url);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("running");
    setMessage("");
    setLoading(true);

    if (!webhookUrl) {
      setStatus("error");
      setMessage("Please configure your webhook URL in Settings first.");
      setLoading(false);
      return;
    }

    try {
      const keywordArray = keywords
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k.length > 0);

      const payload = {
        region,
        industry,
        keywords: keywordArray,
        campaign: campaignName || "Unnamed Campaign",
      };

      const response = await axios.post(webhookUrl, payload, {
        timeout: 30000,
      });

      if (response.status === 200 || response.status === 201) {
        setStatus("completed");
        setMessage(
          `Successfully triggered workflow! ${
            response.data?.message || "The n8n workflow is now processing your search."
          }`
        );

        setRegion("");
        setIndustry("");
        setKeywords("");
        setCampaignName("");
      } else {
        setStatus("error");
        setMessage("Webhook returned an unexpected status. Please check your n8n workflow.");
      }
    } catch (error) {
      setStatus("error");
      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNABORTED") {
          setMessage("Request timed out. Please check if your webhook URL is correct.");
        } else if (error.response) {
          setMessage(
            `Webhook error: ${error.response.status} - ${
              error.response.data?.message || "Unknown error"
            }`
          );
        } else if (error.request) {
          setMessage("Could not reach the webhook URL. Please verify it is accessible.");
        } else {
          setMessage(`Error: ${error.message}`);
        }
      } else {
        setMessage("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingSettings) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Search & Trigger</h1>
        <p className="mt-2 text-gray-600">
          Define your search parameters and trigger the email automation workflow
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
                Region <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                required
                placeholder="e.g., Brazil, São Paulo, Latin America"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">Geographic region to target</p>
            </div>

            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
                Industry <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                required
                placeholder="e.g., Tech, Retail, Healthcare"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">Industry sector to focus on</p>
            </div>
          </div>

          <div>
            <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-1">
              Keywords <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              required
              placeholder="e.g., automation, CRM, SaaS"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              Comma-separated keywords to search for (e.g., "automation, CRM, SaaS")
            </p>
          </div>

          <div>
            <label htmlFor="campaignName" className="block text-sm font-medium text-gray-700 mb-1">
              Campaign Name <span className="text-gray-400">(Optional)</span>
            </label>
            <input
              type="text"
              id="campaignName"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g., Q4 Tech Outreach"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              Tag this search with a campaign name for easier tracking
            </p>
          </div>

          {!webhookUrl && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Webhook URL not configured</p>
                <p className="mt-1">
                  Please configure your n8n webhook URL in the Settings page before triggering a
                  search.
                </p>
              </div>
            </div>
          )}

          {status === "running" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
              <Loader className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5 animate-spin" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Triggering workflow...</p>
                <p className="mt-1">Sending parameters to n8n webhook</p>
              </div>
            </div>
          )}

          {status === "completed" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
              <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-800">
                <p className="font-medium">Success!</p>
                <p className="mt-1">{message}</p>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-medium">Error</p>
                <p className="mt-1">{message}</p>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading || !webhookUrl}
              className="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin h-5 w-5 mr-2" />
                  Triggering...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  Trigger Search Campaign
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">How it works</h3>
          <ol className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 font-medium mr-2">
                1
              </span>
              <span>Enter your search parameters (region, industry, keywords)</span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 font-medium mr-2">
                2
              </span>
              <span>Click "Trigger Search Campaign" to send parameters to your n8n workflow</span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 font-medium mr-2">
                3
              </span>
              <span>Your n8n workflow will process the search and send emails automatically</span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 font-medium mr-2">
                4
              </span>
              <span>Track all sent emails and responses in the Dashboard</span>
            </li>
          </ol>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Search className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Pro Tip</p>
            <p className="mt-1">
              Use specific keywords and narrower regions for better targeting. You can run multiple
              campaigns with different parameters to test what works best.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
