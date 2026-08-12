import React from 'react';
import { Sparkles, Bookmark, RotateCcw, Lightbulb, Share2 } from 'lucide-react';

interface HeaderProps {
  draftsCount: number;
  onOpenDrafts: () => void;
  onOpenIdeas: () => void;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  draftsCount,
  onOpenDrafts,
  onOpenIdeas,
  onReset,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-slate-100 tracking-tight">SocialCraft AI</h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Gemini 3 Pro
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Cross-Platform Content & Visual Generator
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={onOpenIdeas}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors border border-slate-700/60"
            title="Brainstorm Topic Angles"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Brainstorm Ideas</span>
          </button>

          <button
            onClick={onOpenDrafts}
            className="relative inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors border border-slate-700/60"
            title="Saved Drafts History"
          >
            <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Saved Drafts</span>
            {draftsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 py-0.5 text-[10px] font-bold bg-indigo-500 text-white rounded-full">
                {draftsCount}
              </span>
            )}
          </button>

          <button
            onClick={onReset}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Reset form"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
