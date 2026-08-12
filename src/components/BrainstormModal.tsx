import React, { useState } from 'react';
import { X, Lightbulb, Sparkles, Plus, ArrowRight } from 'lucide-react';

interface BrainstormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectIdea: (idea: string) => void;
}

export const BrainstormModal: React.FC<BrainstormModalProps> = ({
  isOpen,
  onClose,
  onSelectIdea,
}) => {
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedIdeas, setSuggestedIdeas] = useState<string[]>([
    "5 hard truths I wish I knew before becoming a senior developer",
    "How we reduced customer churn by 40% using automated onboarding workflows",
    "Why AI isn't taking your job, but someone using AI will replace you",
    "Behind the scenes: The design decisions that made our mobile app go viral",
    "A honest teardown of the top 3 productivity frameworks used by founders"
  ]);

  if (!isOpen) return null;

  const handleFetchIdeas = async () => {
    if (!topic.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/suggest-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ideas && Array.isArray(data.ideas) && data.ideas.length > 0) {
          setSuggestedIdeas(data.ideas);
          return;
        }
      }
    } catch (err) {
      // Ignore network failure on static hosts
    } finally {
      setIsLoading(false);
    }

    const t = topic.trim();
    setSuggestedIdeas([
      `3 actionable strategies for ${t} that yielded immediate results`,
      `The biggest mistake people make when approaching ${t} (and how to fix it)`,
      `How we streamlined our process for ${t} in under 30 days`,
      `5 non-obvious tools that completely changed our approach to ${t}`,
      `Why ${t} will be the #1 focus for creators and founders in 2026`,
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-2">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold text-slate-100">AI Topic & Angle Brainstormer</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input bar */}
        <div className="p-6 space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFetchIdeas()}
              placeholder="e.g. SaaS pricing, Remote work, B2B Marketing, AI tools"
              className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleFetchIdeas}
              disabled={isLoading || !topic.trim()}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Brainstorming...' : 'Generate Angles'}</span>
            </button>
          </div>

          {/* Ideas list */}
          <div className="space-y-2.5 pt-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Suggested High-Engagement Hooks
            </span>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {suggestedIdeas.map((ideaText, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onSelectIdea(ideaText);
                    onClose();
                  }}
                  className="w-full p-3.5 bg-slate-950 border border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-950/80 rounded-xl text-left text-xs text-slate-200 flex items-center justify-between group transition-all"
                >
                  <span className="leading-relaxed pr-2">{ideaText}</span>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
