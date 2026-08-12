import React, { useState } from 'react';
import { X, Download, Copy, Check, Sparkles } from 'lucide-react';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  prompt: string;
}

export const ImageModal: React.FC<ImageModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  prompt,
}) => {
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  if (!isOpen || !imageUrl) return null;

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch (err) {
      console.error('Failed to copy prompt:', err);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `socialcraft-generated-visual-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-slate-100">AI Generated Visual Asset</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto flex flex-col md:flex-row gap-6 items-center">
          {/* Image Display */}
          <div className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center p-2 min-h-[300px]">
            <img
              src={imageUrl}
              alt="Generated visual asset"
              className="max-h-[60vh] w-auto object-contain rounded-lg"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Side Info & Prompt Details */}
          <div className="w-full md:w-80 space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                Generation Prompt
              </span>
              <p className="text-xs text-slate-300 mt-1 p-3 bg-slate-950 border border-slate-800 rounded-xl leading-relaxed font-mono">
                {prompt}
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleCopyPrompt}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors border border-slate-700"
              >
                {copiedPrompt ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Prompt Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Copy Prompt</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownload}
                className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors shadow-lg shadow-indigo-600/20"
              >
                <Download className="w-4 h-4" />
                <span>Download Image</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
