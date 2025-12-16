import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Email, EmailStatus, LeadClassification } from '../types/database';
import { useAuth } from '../contexts/AuthContext';
import { KPICard } from '../components/KPICard';
import { EmailFilters } from '../components/EmailFilters';
import { EmailTable } from '../components/EmailTable';
import { EmailActionsMenu } from '../components/EmailActionsMenu';
import { useEmailSelection } from '../hooks/useEmailSelection';
import { triggerInitialEmails } from '../lib/api';
import { Mail, MessageSquare, Flame, TrendingUp } from 'lucide-react';

export function Dashboard() {
  const { user } = useAuth();
  const [emails, setEmails] = useState<Email[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);

  const [statusFilter, setStatusFilter] = useState<EmailStatus | 'all'>('all');
  const [classificationFilter, setClassificationFilter] = useState<LeadClassification | 'all'>('all');
  const [campaignFilter, setCampaignFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [sortField, setSortField] = useState<keyof Email>('date_sent');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [actionLoading, setActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  useEffect(() => {
    if (user) {
      fetchEmails();
    }
  }, [user]);

  useEffect(() => {
    filterAndSortEmails();
  }, [emails, statusFilter, classificationFilter, campaignFilter, searchQuery, sortField, sortDirection]);

  const { selectedIds, selectedEmails, isAllSelected, toggleEmailSelection, toggleSelectAllVisible, clearSelection } =
    useEmailSelection(filteredEmails);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('emails')
        .select('*')
        .order('date_sent', { ascending: false });

      if (error) throw error;
      setEmails(data || []);
    } catch (error) {
      console.error('Error fetching emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortEmails = () => {
    let filtered = [...emails];

    if (statusFilter !== 'all') {
      filtered = filtered.filter((email) => email.status === statusFilter);
    }

    if (classificationFilter !== 'all') {
      filtered = filtered.filter((email) => email.lead_classification === classificationFilter);
    }

    if (campaignFilter) {
      filtered = filtered.filter((email) =>
        email.campaign_name.toLowerCase().includes(campaignFilter.toLowerCase())
      );
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (email) =>
          email.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
          email.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredEmails(filtered);
    setCurrentPage(1);
  };

  const handleSort = (field: keyof Email) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const totalSent = emails.length;
  const totalReplies = emails.filter((email) => email.status === 'replied').length;
  const hotLeads = emails.filter((email) => email.lead_classification === 'hot').length;
  const bounced = emails.filter((email) => email.status === 'bounced').length;

  const paginatedEmails = filteredEmails.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredEmails.length / itemsPerPage);

  const handleSendInitialEmails = async () => {
    if (!selectedEmails.length || actionLoading) return;

    try {
      setActionLoading(true);
      setActionFeedback({ type: 'info', message: 'Triggering initial email webhook...' });
      await triggerInitialEmails(selectedEmails.map((email) => email.email));
      setActionFeedback({
        type: 'success',
        message: `Webhook triggered for ${selectedEmails.length} recipient${selectedEmails.length > 1 ? 's' : ''}.`,
      });
      clearSelection();
    } catch (error) {
      console.error('Error sending initial emails:', error);
      setActionFeedback({
        type: 'error',
        message: 'Failed to trigger webhook. Please try again.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleWebhookTrigger = () => {
    setActionFeedback({
      type: 'info',
      message: 'Additional webhook actions will be available soon.',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Track and manage all your cold email campaigns</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Total Sent" value={totalSent} icon={Mail} color="bg-blue-600" />
        <KPICard title="Replies Received" value={totalReplies} icon={MessageSquare} color="bg-green-600" />
        <KPICard title="Hot Leads" value={hotLeads} icon={Flame} color="bg-red-600" />
        <KPICard title="Bounced" value={bounced} icon={TrendingUp} color="bg-orange-600" />
      </div>

      <EmailFilters
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        classificationFilter={classificationFilter}
        setClassificationFilter={setClassificationFilter}
        campaignFilter={campaignFilter}
        setCampaignFilter={setCampaignFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {selectedEmails.length > 0 && (
        <EmailActionsMenu
          selectedCount={selectedEmails.length}
          onSendInitialEmail={handleSendInitialEmails}
          onWebhookTrigger={handleWebhookTrigger}
          onClear={clearSelection}
          loading={actionLoading}
          feedback={actionFeedback}
        />
      )}
      {actionFeedback && selectedEmails.length === 0 && (
        <div
          className={`text-sm px-3 py-2 rounded-md border ${
            actionFeedback.type === 'success'
              ? 'bg-green-50 text-green-800 border-green-100'
              : actionFeedback.type === 'error'
                ? 'bg-red-50 text-red-800 border-red-100'
                : 'bg-blue-50 text-blue-800 border-blue-100'
          }`}
        >
          {actionFeedback.message}
        </div>
      )}

      <EmailTable
        emails={paginatedEmails}
        onEmailClick={setSelectedEmail}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        selectedIds={selectedIds}
        onToggleEmail={toggleEmailSelection}
        onToggleAll={() => toggleSelectAllVisible(paginatedEmails)}
        allSelected={isAllSelected(paginatedEmails)}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 border border-gray-200 rounded-lg">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, filteredEmails.length)}
                </span>{' '}
                of <span className="font-medium">{filteredEmails.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === pageNum
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {selectedEmail && (
        <EmailDetailModal
          email={selectedEmail}
          onClose={() => setSelectedEmail(null)}
          onUpdate={fetchEmails}
        />
      )}
    </div>
  );
}

import { EmailDetailModal } from '../components/EmailDetailModal';
