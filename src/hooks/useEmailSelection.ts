import { useEffect, useMemo, useState } from 'react';
import { Email } from '../types/database';

interface SelectionState {
  selectedIds: Set<string>;
  selectedEmails: Email[];
  isAllSelected: (visibleEmails: Email[]) => boolean;
  toggleEmailSelection: (emailId: string) => void;
  toggleSelectAllVisible: (visibleEmails: Email[]) => void;
  clearSelection: () => void;
}

export function useEmailSelection(emails: Email[]): SelectionState {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const validIds = new Set(emails.map((email) => email.id));
    setSelectedIds((prev) => new Set([...prev].filter((id) => validIds.has(id))));
  }, [emails]);

  const toggleEmailSelection = (emailId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(emailId)) {
        next.delete(emailId);
      } else {
        next.add(emailId);
      }
      return next;
    });
  };

  const toggleSelectAllVisible = (visibleEmails: Email[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected = visibleEmails.every((email) => next.has(email.id));

      if (allSelected) {
        visibleEmails.forEach((email) => next.delete(email.id));
      } else {
        visibleEmails.forEach((email) => next.add(email.id));
      }

      return next;
    });
  };

  const isAllSelected = (visibleEmails: Email[]) =>
    visibleEmails.length > 0 && visibleEmails.every((email) => selectedIds.has(email.id));

  const clearSelection = () => setSelectedIds(new Set());

  const selectedEmails = useMemo(
    () => emails.filter((email) => selectedIds.has(email.id)),
    [emails, selectedIds]
  );

  return {
    selectedIds,
    selectedEmails,
    isAllSelected,
    toggleEmailSelection,
    toggleSelectAllVisible,
    clearSelection,
  };
}
