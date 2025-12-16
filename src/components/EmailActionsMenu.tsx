interface EmailActionsMenuProps {
  selectedCount: number;
  onSendInitialEmail: () => void;
  onWebhookTrigger?: () => void;
  onClear: () => void;
  loading?: boolean;
  feedback?: {
    type: 'success' | 'error' | 'info';
    message: string;
  } | null;
}

export function EmailActionsMenu({
  selectedCount,
  onSendInitialEmail,
  onWebhookTrigger,
  onClear,
  loading = false,
  feedback,
}: EmailActionsMenuProps) {
  return (
    <div className="flex flex-col gap-3 bg-white border border-blue-100 shadow-sm rounded-lg p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-700 font-semibold flex items-center justify-center">
            {selectedCount}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {selectedCount} email{selectedCount > 1 ? 's' : ''} selected
            </p>
            <p className="text-xs text-gray-500">Choose an action to run on the selected records.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onSendInitialEmail}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Sending...' : 'Send Initial Email'}
          </button>
          <button
            onClick={onWebhookTrigger}
            disabled={!onWebhookTrigger || loading}
            className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            Webhook Trigger
          </button>
          <button
            onClick={onClear}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
      {feedback && (
        <div
          className={`text-sm px-3 py-2 rounded-md ${
            feedback.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-100'
              : feedback.type === 'error'
                ? 'bg-red-50 text-red-800 border border-red-100'
                : 'bg-blue-50 text-blue-800 border border-blue-100'
          }`}
        >
          {feedback.message}
        </div>
      )}
    </div>
  );
}
