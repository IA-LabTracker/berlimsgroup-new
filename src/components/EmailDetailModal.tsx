import { useState, FormEvent } from "react";
import { X, Save } from "lucide-react";
import type { Email, LeadClassification } from "../types/database";
import { supabase } from "../lib/supabase";

interface EmailDetailModalProps {
  email: Email;
  onClose: () => void;
  onUpdate: () => void;
}

export function EmailDetailModal({ email, onClose, onUpdate }: EmailDetailModalProps) {
  const [classification, setClassification] = useState<LeadClassification>(
    email.lead_classification
  );
  const [notes, setNotes] = useState(email.notes);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const { error } = await supabase
        .from("emails")
        .update({
          lead_classification: classification,
          notes,
        })
        .eq("id", email.id);

      if (error) throw error;

      onUpdate();
      onClose();
    } catch (err) {
      setError("Failed to update email. Please try again.");
      console.error("Error updating email:", err);
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "text-blue-600 bg-blue-50";
      case "replied":
        return "text-green-600 bg-green-50";
      case "bounced":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Email Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900 font-medium">
                {email.company}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">{email.email}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
              <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">{email.region}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
              <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">{email.industry}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <div className={`px-4 py-2 rounded-lg font-medium ${getStatusColor(email.status)}`}>
                {email.status.charAt(0).toUpperCase() + email.status.slice(1)}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Sent</label>
              <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
                {new Date(email.date_sent).toLocaleString()}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Campaign</label>
              <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
                {email.campaign_name || "No campaign assigned"}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
              <div className="flex flex-wrap gap-2">
                {email.keywords.map((keyword, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {email.response_content && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Response</label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-900 whitespace-pre-wrap">{email.response_content}</p>
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="classification"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Lead Classification
            </label>
            <select
              id="classification"
              value={classification}
              onChange={(e) => setClassification(e.target.value as LeadClassification)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="hot">Hot</option>
              <option value="warm">Warm</option>
              <option value="cold">Cold</option>
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Hot: Ready to engage | Warm: Interested | Cold: Low interest
            </p>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add your notes about this lead..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
