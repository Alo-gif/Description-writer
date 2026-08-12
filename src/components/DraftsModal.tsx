import React, { useState } from 'react';
import { X, Trash2, Copy, Download, Calendar, ExternalLink, Search } from 'lucide-react';
import { SavedDraft } from '../types';

interface DraftsModalProps {
  isOpen: boolean;
  onClose: () => void;
  drafts: SavedDraft[];
  onSelectDraft: (draft: SavedDraft) => void;
  onDeleteDraft: (id: string) => void;
  onClearAllDrafts: () => void;
}

export const DraftsModal: React.FC<DraftsModalProps> = ({
  isOpen,
  onClose,
  drafts,
  onSelectDraft,
  onDeleteDraft,
  onClearAllDrafts,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredDrafts = drafts.filter((d) =>
    d.idea.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExportAll = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(drafts, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `socialcraft-drafts-export-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-2">
            <span className="text-xl">📚</span>
            <h2 className="text-lg font-bold text-slate-100">Saved Drafts History</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
              {drafts.length}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {drafts.length > 0 && (
              <button
                onClick={handleExportAll}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center space-x-1.5 transition-colors border border-slate-700"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>Export JSON</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search saved ideas..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {drafts.length > 0 && (
            <button
              onClick={onClearAllDrafts}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center space-x-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All History</span>
            </button>
          )}
        </div>

        {/* Draft List */}
        <div className="p-6 flex-1 overflow-y-auto space-y-3">
          {filteredDrafts.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm space-y-2">
              <p>No saved drafts found.</p>
              <p className="text-xs text-slate-600">Generated posts will automatically save here for future access.</p>
            </div>
          ) : (
            filteredDrafts.map((draft) => (
              <div
                key={draft.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">
                      {draft.tone} tone
                    </span>
                    <h3 className="text-sm font-bold text-slate-100 line-clamp-1">{draft.idea}</h3>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-mono">
                      <Calendar className="w-3 h-3 text-slate-600" />
                      <span>{new Date(draft.timestamp).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        onSelectDraft(draft);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1 transition-colors"
                    >
                      <span>Load Draft</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteDraft(draft.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-colors"
                      title="Delete draft"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Platforms preview pill list */}
                <div className="flex items-center space-x-2 pt-1 border-t border-slate-900">
                  <span className="text-[10px] text-slate-500">Available formats:</span>
                  {Object.keys(draft.posts || {}).map((platformKey) => (
                    <span
                      key={platformKey}
                      className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 capitalize"
                    >
                      {platformKey}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
