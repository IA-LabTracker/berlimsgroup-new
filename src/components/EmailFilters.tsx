import { EmailStatus, LeadClassification } from '../types/database';

interface EmailFiltersProps {
  statusFilter: EmailStatus | 'all';
  setStatusFilter: (status: EmailStatus | 'all') => void;
  classificationFilter: LeadClassification | 'all';
  setClassificationFilter: (classification: LeadClassification | 'all') => void;
  campaignFilter: string;
  setCampaignFilter: (campaign: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function EmailFilters({
  statusFilter,
  setStatusFilter,
  classificationFilter,
  setClassificationFilter,
  campaignFilter,
  setCampaignFilter,
  searchQuery,
  setSearchQuery,
}: EmailFiltersProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as EmailStatus | 'all')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All</option>
            <option value="sent">Sent</option>
            <option value="replied">Replied</option>
            <option value="bounced">Bounced</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Classification</label>
          <select
            value={classificationFilter}
            onChange={(e) => setClassificationFilter(e.target.value as LeadClassification | 'all')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All</option>
            <option value="hot">Hot</option>
            <option value="warm">Warm</option>
            <option value="cold">Cold</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Campaign</label>
          <input
            type="text"
            value={campaignFilter}
            onChange={(e) => setCampaignFilter(e.target.value)}
            placeholder="Filter by campaign"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search company or email"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
}
