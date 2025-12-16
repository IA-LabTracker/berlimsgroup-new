import { Email, EmailStatus, LeadClassification } from '../types/database';
import { ArrowUpDown, Eye } from 'lucide-react';

interface EmailTableProps {
  emails: Email[];
  onEmailClick: (email: Email) => void;
  sortField: keyof Email;
  sortDirection: 'asc' | 'desc';
  onSort: (field: keyof Email) => void;
  selectedIds: Set<string>;
  onToggleEmail: (id: string) => void;
  onToggleAll: () => void;
  allSelected: boolean;
}

export function EmailTable({
  emails,
  onEmailClick,
  sortField,
  sortDirection,
  onSort,
  selectedIds,
  onToggleEmail,
  onToggleAll,
  allSelected,
}: EmailTableProps) {
  const getStatusBadgeColor = (status: EmailStatus) => {
    switch (status) {
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'replied':
        return 'bg-green-100 text-green-800';
      case 'bounced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getClassificationBadgeColor = (classification: LeadClassification) => {
    switch (classification) {
      case 'hot':
        return 'bg-red-100 text-red-800';
      case 'warm':
        return 'bg-yellow-100 text-yellow-800';
      case 'cold':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const SortButton = ({ field, label }: { field: keyof Email; label: string }) => (
    <button
      onClick={() => onSort(field)}
      className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
    >
      <span>{label}</span>
      <ArrowUpDown
        className={`h-4 w-4 transition-transform ${
          sortField === field ? 'text-blue-600' : 'text-gray-400'
        } ${sortField === field && sortDirection === 'asc' ? 'rotate-180' : ''}`}
      />
    </button>
  );

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-12">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() => onToggleAll()}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  aria-label="Select all emails on this page"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                <SortButton field="company" label="Company" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                <SortButton field="email" label="Email" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                <SortButton field="region" label="Region" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                <SortButton field="industry" label="Industry" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Keywords
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                <SortButton field="status" label="Status" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                <SortButton field="lead_classification" label="Lead" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Campaign
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                <SortButton field="date_sent" label="Date Sent" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {emails.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-6 py-8 text-center text-gray-500">
                  No emails found. Start by triggering a search campaign.
                </td>
              </tr>
            ) : (
              emails.map((email) => (
                <tr key={email.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(email.id)}
                      onChange={() => onToggleEmail(email.id)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      aria-label={`Select email ${email.email}`}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {email.company}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{email.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{email.region}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{email.industry}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex flex-wrap gap-1">
                      {email.keywords.slice(0, 2).map((keyword, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {keyword}
                        </span>
                      ))}
                      {email.keywords.length > 2 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          +{email.keywords.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                        email.status
                      )}`}
                    >
                      {email.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getClassificationBadgeColor(
                        email.lead_classification
                      )}`}
                    >
                      {email.lead_classification}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {email.campaign_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(email.date_sent).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => onEmailClick(email)}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                      title="View details"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
