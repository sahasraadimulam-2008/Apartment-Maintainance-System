import React from 'react';
import { FolderOpen } from 'lucide-react';

export default function EmptyState({
  title = 'No records found',
  description = 'There are no items to display at this time.',
  icon: Icon = FolderOpen,
  actionText,
  onAction
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-ivory-300 shadow-subtle my-4">
      <div className="w-14 h-14 rounded-2xl bg-ivory-100 flex items-center justify-center text-navy-800/60 mb-4 border border-ivory-200">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="font-display font-semibold text-lg text-navy-900 mb-1">{title}</h3>
      <p className="text-sm text-navy-800/70 max-w-sm mb-6">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center px-4 py-2 bg-navy-900 hover:bg-navy-800 text-ivory-50 text-sm font-medium rounded-lg transition shadow-sm hover:shadow"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
