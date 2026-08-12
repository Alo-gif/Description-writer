import React, { useState } from 'react';
import {
  Sparkles,
  Upload,
  X,
  Sliders,
  Image as ImageIcon,
  Check,
  ChevronDown,
  Layers,
  Zap,
  HelpCircle
} from 'lucide-react';
import {
  SocialPlatform,
  Tone,
  AspectRatio,
  ImageSize,
  ImageStylePreset,
  GenerationRequest
} from '../types';

interface IdeaInputProps {
  onSubmit: (request: GenerationRequest) => void;
  isGenerating: boolean;
}

const TONE_OPTIONS: { id: Tone; label: string; emoji: string; desc: string }[] = [
  { id: 'professional', label: 'Professional', emoji: '👔', desc: 'Authoritative, clear & polished' },
  { id: 'witty', label: 'Witty', emoji: '⚡', desc: 'Clever, humorous & engaging' },
  { id: 'urgent', label: 'Urgent', emoji: '🚨', desc: 'High impact, breaking news feel' },
  { id: 'thought_leader', label: 'Thought Leader', emoji: '💡', desc: 'Insightful, visionary & deep' },
  { id: 'bold', label: 'Bold', emoji: '🔥', desc: 'Contrarian, energetic & confident' },
  { id: 'enthusiastic', label: 'Enthusiastic', emoji: '🎉', desc: 'High-energy, promotional & hype' },
  { id: 'empathetic', label: 'Empathetic', emoji: '🌿', desc: 'Human, authentic & relatable' },
  { id: 'casual', label: 'Casual', emoji: '💬', desc: 'Conversational & laid-back' },
  { id: 'custom', label: 'Custom Tone', emoji: '✏️', desc: 'Define your own voice' },
];

const PLATFORMS: { id: SocialPlatform; label: string; icon: string; color: string }[] = [
  { id: 'linkedin', label: 'LinkedIn', icon: '💼', color: 'from-blue-600 to-indigo-700' },
  { id: 'twitter', label: 'Twitter / X', icon: '𝕏', color: 'from-slate-700 to-slate-900' },
  { id: 'instagram', label: 'Instagram', icon: '📸', color: 'from-pink-500 via-purple-500 to-amber-500' },
  { id: 'threads', label: 'Threads', icon: '🧵', color: 'from-zinc-800 to-zinc-950' },
];

const STYLE_PRESETS: { id: ImageStylePreset; label: string; desc: string }[] = [
  { id: 'modern_minimalist', label: 'Modern Minimalist', desc: 'Clean vector, subtle gradients & spacious layout' },
  { id: 'photorealistic_corporate', label: 'Studio Photography', desc: '8K photorealistic editorial lighting' },
  { id: 'vibrant_illustration', label: 'Vibrant Digital Art', desc: 'Rich color palette & expressive vectors' },
  { id: 'abstract_3d', label: 'Abstract 3D Clay/Glass', desc: 'Smooth 3D render with soft pastel shadows' },
  { id: 'cyberpunk_neon', label: 'Cyberpunk Neon', desc: 'High-contrast neon blues, purples & glow' },
  { id: 'retro_editorial', label: 'Retro Editorial', desc: 'Vintage magazine aesthetic & film grain' },
  { id: 'cinematic_photo', label: 'Cinematic Movie Frame', desc: 'Wide dramatic lighting & bokeh' },
];

const ASPECT_RATIOS: { id: AspectRatio; label: string; desc: string }[] = [
  { id: '1:1', label: '1:1 Square', desc: 'Instagram Feed, LinkedIn Post' },
  { id: '16:9', label: '16:9 Landscape', desc: 'Twitter/X Header & Feed, LinkedIn Banner' },
  { id: '9:16', label: '9:16 Vertical', desc: 'Instagram Story/Reel, Mobile' },
  { id: '3:4', label: '3:4 Portrait', desc: 'Instagram Feed Vertical' },
  { id: '4:3', label: '4:3 Standard', desc: 'Blog & Card Preview' },
  { id: '3:2', label: '3:2 Photo', desc: 'Classic Camera Ratio' },
  { id: '2:3', label: '2:3 Tall', desc: 'Pinterest / Poster' },
  { id: '21:9', label: '21:9 Ultrawide', desc: 'Ultrawide Cinematic' },
];

const IMAGE_SIZES: { id: ImageSize; label: string; desc: string }[] = [
  { id: '1K', label: '1K Resolution', desc: '1024px - Standard high quality' },
  { id: '2K', label: '2K Resolution', desc: '2048px - Crisp studio quality' },
  { id: '4K', label: '4K Ultra HD', desc: '4096px - Maximum detail & print ready' },
];

const SAMPLE_IDEAS = [
  "Launching our new AI productivity tool that automates weekly team status reports in Slack.",
  "Share 5 lessons learned after scaling a remote tech startup from $0 to $1M ARR in 18 months.",
  "Why traditional 9-to-5 office hours are becoming obsolete for creative software engineers.",
  "Announcing our summer product feature update: live collaborative canvas & real-time comments.",
];

export const IdeaInput: React.FC<IdeaInputProps> = ({ onSubmit, isGenerating }) => {
  const [idea, setIdea] = useState('');
  const [tone, setTone] = useState<Tone>('professional');
  const [customTone, setCustomTone] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([
    'linkedin',
    'twitter',
    'instagram',
  ]);
  const [stylePreset, setStylePreset] = useState<ImageStylePreset>('modern_minimalist');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [imageSize, setImageSize] = useState<ImageSize>('1K');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const togglePlatform = (p: SocialPlatform) => {
    if (selectedPlatforms.includes(p)) {
      if (selectedPlatforms.length > 1) {
        setSelectedPlatforms(selectedPlatforms.filter((item) => item !== p));
      }
    } else {
      setSelectedPlatforms([...selectedPlatforms, p]);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) return;

    onSubmit({
      idea: idea.trim(),
      tone,
      customTone: tone === 'custom' ? customTone : undefined,
      selectedPlatforms,
      imageStylePreset: stylePreset,
      defaultAspectRatio: aspectRatio,
      defaultImageSize: imageSize,
      referenceImageBase64: referenceImage || undefined,
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl shadow-slate-950/50">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Idea Textarea */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              What is your topic or content idea?
            </label>
            <span className="text-xs text-slate-400">
              {idea.length} characters
            </span>
          </div>

          <div className="relative">
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="e.g. Announcing our new AI code assistant feature. Mention its speed, privacy guarantees, and free trial for developers..."
              className="w-full h-32 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm leading-relaxed resize-none"
              required
            />

            {referenceImage && (
              <div className="absolute bottom-3 left-3 flex items-center space-x-2 bg-slate-800/90 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200">
                <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                <span className="truncate max-w-[140px]">Ref Image Attached</span>
                <button
                  type="button"
                  onClick={() => setReferenceImage(null)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Quick Idea Starters */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-medium text-slate-400">Try sample idea:</span>
            {SAMPLE_IDEAS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setIdea(sample)}
                className="text-xs text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-md px-2.5 py-1 transition-colors text-left truncate max-w-[280px]"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>

        {/* Tone Selection */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <span>🎭</span> Desired Content Tone
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {TONE_OPTIONS.map((t) => {
              const isSelected = tone === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTone(t.id)}
                  className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-indigo-600/15 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500/30'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 w-full justify-between">
                    <span className="text-sm">{t.emoji}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </div>
                  <span className="text-xs font-semibold mt-1">{t.label}</span>
                  <span className="text-[10px] text-slate-400 leading-tight mt-0.5 line-clamp-1">
                    {t.desc}
                  </span>
                </button>
              );
            })}
          </div>

          {tone === 'custom' && (
            <div className="pt-2">
              <input
                type="text"
                value={customTone}
                onChange={(e) => setCustomTone(e.target.value)}
                placeholder="e.g. Sarcastic tech journalist with heavy data emphasis and punchy cliffhangers"
                className="w-full px-3.5 py-2 bg-slate-950 border border-indigo-500/50 rounded-lg text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>

        {/* Target Platform Toggles */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            Target Platforms (Simultaneous Generation)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PLATFORMS.map((p) => {
              const active = selectedPlatforms.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePlatform(p.id)}
                  className={`flex items-center space-x-3 p-3 rounded-xl border transition-all ${
                    active
                      ? 'bg-slate-800/90 border-slate-600 text-white shadow-md'
                      : 'bg-slate-950/40 border-slate-800/60 text-slate-500 hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold bg-gradient-to-tr ${
                      active ? p.color : 'from-slate-800 to-slate-900'
                    } text-white shadow-sm`}
                  >
                    {p.icon}
                  </div>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-xs font-medium">{p.label}</span>
                    <span className="text-[10px] text-slate-400">
                      {active ? 'Selected' : 'Click to enable'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Toggle Advanced Visual Settings */}
        <div className="pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full text-xs font-semibold text-indigo-400 hover:text-indigo-300 py-1 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              AI Visual & Image Settings (Aspect Ratio, 1K/2K/4K Size, Style)
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            />
          </button>

          {showAdvanced && (
            <div className="mt-4 p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-5">
              {/* Image Style Presets */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">
                  Visual Style Preset
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {STYLE_PRESETS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStylePreset(s.id)}
                      className={`p-2 rounded-lg border text-left text-xs transition-colors ${
                        stylePreset === s.id
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-medium truncate">{s.label}</div>
                      <div className="text-[10px] text-slate-500 line-clamp-1">{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio Picker */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Default Aspect Ratio
                  </label>
                  <span className="text-[10px] text-indigo-400 font-mono">
                    gemini-3-pro-image
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ASPECT_RATIOS.map((ar) => (
                    <button
                      key={ar.id}
                      type="button"
                      onClick={() => setAspectRatio(ar.id)}
                      className={`p-2 rounded-lg border text-left text-xs transition-colors ${
                        aspectRatio === ar.id
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold font-mono text-xs">{ar.id}</div>
                      <div className="text-[10px] text-slate-500 truncate">{ar.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Resolution / Image Size (1K, 2K, 4K) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Image Quality & Resolution (Size)</span>
                  <span className="text-[10px] text-slate-400">1K, 2K, 4K supported</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {IMAGE_SIZES.map((size) => (
                    <button
                      key={size.id}
                      type="button"
                      onClick={() => setImageSize(size.id)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        imageSize === size.id
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-sm font-mono">{size.label}</div>
                      <div className="text-[10px] text-slate-500">{size.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Reference Image File Attach */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-800/60">
                <div>
                  <span className="text-xs font-medium text-slate-300">Reference Image Context</span>
                  <p className="text-[10px] text-slate-500">Attach a screenshot, mock, or product image to inform AI generation</p>
                </div>
                <label className="cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-medium transition-colors">
                  <Upload className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Attach Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Submit Action Button */}
        <button
          type="submit"
          disabled={isGenerating || !idea.trim()}
          className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white flex items-center justify-center space-x-2 shadow-xl transition-all duration-200 ${
            isGenerating || !idea.trim()
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 active:scale-[0.99] shadow-indigo-500/25'
          }`}
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Generating Cross-Platform Drafts & Visuals...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate Posts for {selectedPlatforms.length} Platforms</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
