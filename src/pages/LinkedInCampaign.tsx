import { useState, useEffect, useCallback, FormEvent, ChangeEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import type { Settings } from "../types/database";
import { parseCSV } from "../lib/csv";
import type { LinkedInLead } from "../types/linkedin";
import axios from "axios";
import {
  Linkedin,
  Upload,
  Send,
  CheckCircle,
  AlertCircle,
  Loader,
  X,
  FileText,
  Users,
  Clock,
  Unlink,
} from "lucide-react";

type Status = "idle" | "sending" | "success" | "error";

export function LinkedInCampaign() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [linkedinAccountId, setLinkedinAccountId] = useState("");
  const [linkedinConnected, setLinkedinConnected] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");

  const [leads, setLeads] = useState<LinkedInLead[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");

  const [messageTemplate, setMessageTemplate] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [delaySeconds, setDelaySeconds] = useState(90);
  const [maxLeads, setMaxLeads] = useState(0);

  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("settings")
        .select("linkedin_account_id, linkedin_webhook_url")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        const settings = data as Settings;
        if (settings.linkedin_account_id) {
          setLinkedinAccountId(settings.linkedin_account_id);
          setLinkedinConnected(true);
        }
        if (settings.linkedin_webhook_url) {
          setWebhookUrl(settings.linkedin_webhook_url);
        }
      }
    } catch (err) {
      console.error("Error loading LinkedIn settings:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const handleOAuthCallback = useCallback(async () => {
    const accountId = searchParams.get("account_id");
    if (!accountId || !user?.id) return;

    try {
      const { data: existing } = await supabase
        .from("settings")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      const update = { linkedin_account_id: accountId };

      if (existing) {
        await supabase.from("settings").update(update).eq("user_id", user.id);
      } else {
        await supabase.from("settings").insert({ user_id: user.id, ...update });
      }

      setLinkedinAccountId(accountId);
      setLinkedinConnected(true);
      setSearchParams({}, { replace: true });
    } catch (err) {
      console.error("Error saving LinkedIn account:", err);
    }
  }, [searchParams, user?.id, setSearchParams]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    handleOAuthCallback();
  }, [handleOAuthCallback]);

  const handleConnectLinkedIn = async () => {
    try {
      const origin = window.location.origin;
      const response = await axios.post("/api/unipile-auth", {
        success_redirect_url: `${origin}/linkedin`,
        failure_redirect_url: `${origin}/linkedin`,
      });

      const authUrl = response.data?.url;
      if (authUrl) {
        window.location.href = authUrl;
      } else {
        console.error("No auth URL returned", response.data);
        setStatus("error");
        setMessage("Failed to generate LinkedIn connection link.");
      }
    } catch (err) {
      console.error("Error creating auth link:", err);
      setStatus("error");
      setMessage("Failed to connect to LinkedIn. Try again.");
    }
  };

  const handleDisconnect = async () => {
    if (!user?.id) return;

    await supabase.from("settings").update({ linkedin_account_id: null }).eq("user_id", user.id);

    setLinkedinAccountId("");
    setLinkedinConnected(false);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvErrors([]);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const result = parseCSV(text);
      setLeads(result.leads);
      setCsvErrors(result.errors);
    };
    reader.readAsText(file);
  };

  const removeFile = () => {
    setLeads([]);
    setCsvErrors([]);
    setFileName("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!linkedinAccountId) {
      setStatus("error");
      setMessage("Connect your LinkedIn account first.");
      return;
    }

    if (!webhookUrl) {
      setStatus("error");
      setMessage("Configure your LinkedIn webhook URL in Settings.");
      return;
    }

    if (leads.length === 0) {
      setStatus("error");
      setMessage("Upload a CSV with at least one lead.");
      return;
    }

    if (!messageTemplate.trim()) {
      setStatus("error");
      setMessage("Write a message template.");
      return;
    }

    setStatus("sending");
    setMessage("");

    const selectedLeads = maxLeads > 0 ? leads.slice(0, maxLeads) : leads;

    try {
      const response = await axios.post(
        webhookUrl,
        {
          userId: user?.id,
          linkedinAccountId,
          leads: selectedLeads,
          messageTemplate,
          delaySeconds,
          campaignName: campaignName || "LinkedIn Campaign",
        },
        { timeout: 30000 }
      );

      if (response.status === 200 || response.status === 201) {
        setStatus("success");
        setMessage(`Campaign sent! ${selectedLeads.length} leads will be processed.`);
      } else {
        setStatus("error");
        setMessage("Unexpected response from webhook.");
      }
    } catch (err) {
      setStatus("error");
      if (axios.isAxiosError(err)) {
        if (err.code === "ECONNABORTED") {
          setMessage("Request timed out. Check your webhook URL.");
        } else if (err.response) {
          setMessage(`Webhook error: ${err.response.status}`);
        } else {
          setMessage("Could not reach the webhook. Check if it is accessible.");
        }
      } else {
        setMessage("An unexpected error occurred.");
      }
    }
  };

  const previewMessage = () => {
    if (!leads.length || !messageTemplate) return "";
    const lead = leads[0];
    return messageTemplate
      .replace(/\{\{firstName\}\}/g, lead.firstName)
      .replace(/\{\{lastName\}\}/g, lead.lastName)
      .replace(/\{\{company\}\}/g, lead.company)
      .replace(/\{\{position\}\}/g, lead.position);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">LinkedIn Campaign</h1>
        <p className="mt-2 text-gray-600">
          Connect your LinkedIn, upload leads and send personalized DMs
        </p>
      </div>

      {/* Step 1: LinkedIn Connection */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Linkedin className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">LinkedIn Account</h2>
          </div>
          {linkedinConnected && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              <CheckCircle className="h-4 w-4 mr-1" />
              Connected
            </span>
          )}
        </div>

        {linkedinConnected ? (
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
            <div>
              <p className="text-sm text-gray-600">Account ID</p>
              <p className="font-mono text-sm text-gray-900">{linkedinAccountId}</p>
            </div>
            <button
              type="button"
              onClick={handleDisconnect}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Unlink className="h-4 w-4 mr-1" />
              Disconnect
            </button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Connect your LinkedIn account via Unipile OAuth. You will be redirected to LinkedIn to
              authorize access securely.
            </p>
            <button
              type="button"
              onClick={handleConnectLinkedIn}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Linkedin className="h-5 w-5 mr-2" />
              Connect LinkedIn
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 2: CSV Upload */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <div className="flex items-center mb-4">
            <Upload className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Upload Leads</h2>
          </div>

          {leads.length === 0 ? (
            <div>
              <label
                htmlFor="csv-upload"
                className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <FileText className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">Click to upload CSV file</p>
                <p className="text-xs text-gray-400 mt-1">
                  Columns: firstName, lastName, company, position, linkedinUrl
                </p>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {csvErrors.length > 0 && (
                <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                  {csvErrors.map((err, i) => (
                    <p key={i} className="text-sm text-red-700">
                      {err}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-1" />
                  <span className="font-medium">{leads.length} leads</span>
                  <span className="mx-2">from</span>
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                    {fileName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">#</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">Name</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">Company</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">Position</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {leads.slice(0, 5).map((lead, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                        <td className="px-4 py-2 text-gray-900">
                          {lead.firstName} {lead.lastName}
                        </td>
                        <td className="px-4 py-2 text-gray-600">{lead.company}</td>
                        <td className="px-4 py-2 text-gray-600">{lead.position}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {leads.length > 5 && (
                  <p className="text-xs text-gray-400 px-4 py-2 bg-gray-50">
                    +{leads.length - 5} more leads
                  </p>
                )}
              </div>

              {csvErrors.length > 0 && (
                <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-yellow-800 mb-1">Warnings:</p>
                  {csvErrors.map((err, i) => (
                    <p key={i} className="text-sm text-yellow-700">
                      {err}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 3: Message Template */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <div className="flex items-center mb-4">
            <FileText className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Message Template</h2>
          </div>

          <textarea
            value={messageTemplate}
            onChange={(e) => setMessageTemplate(e.target.value)}
            rows={8}
            placeholder={`Olá {{firstName}}!\n\nVi que você é {{position}} na {{company}} e fiquei impressionado com o trabalho de vocês.\n\nGostaria de trocar uma ideia rápida?`}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          />

          <div className="mt-3 flex flex-wrap gap-2">
            {["{{firstName}}", "{{lastName}}", "{{company}}", "{{position}}"].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setMessageTemplate((prev) => prev + v)}
                className="px-2 py-1 text-xs font-mono bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
              >
                {v}
              </button>
            ))}
          </div>

          {leads.length > 0 && messageTemplate && (
            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-500 mb-2">Preview (1st lead):</p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{previewMessage()}</p>
            </div>
          )}
        </div>

        {/* Step 4: Campaign Config */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <div className="flex items-center mb-4">
            <Clock className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Campaign Settings</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="My LinkedIn Campaign"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delay between messages (s)
              </label>
              <input
                type="number"
                value={delaySeconds}
                onChange={(e) => setDelaySeconds(Number(e.target.value))}
                min={30}
                max={300}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">Min: 30s, recommended: 90s</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max leads (0 = all)
              </label>
              <input
                type="number"
                value={maxLeads}
                onChange={(e) => setMaxLeads(Number(e.target.value))}
                min={0}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                {maxLeads > 0
                  ? `Will send to ${Math.min(maxLeads, leads.length)} of ${leads.length} leads`
                  : `Will send to all ${leads.length} leads`}
              </p>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {status === "sending" && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
            <Loader className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5 animate-spin" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Sending campaign to workflow...</p>
            </div>
          </div>
        )}

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

        {/* Submit */}
        <button
          type="submit"
          disabled={status === "sending" || !linkedinConnected || leads.length === 0}
          className="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {status === "sending" ? (
            <>
              <Loader className="animate-spin h-5 w-5 mr-2" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-5 w-5 mr-2" />
              Send Campaign
            </>
          )}
        </button>
      </form>
    </div>
  );
}
