import React, { useState } from 'react';
import {
  Copy,
  Check,
  RefreshCw,
  Download,
  Image as ImageIcon,
  Wand2,
  ListOrdered,
  Maximize2,
  MessageSquare,
  Share2,
  SlidersHorizontal,
  Sparkles
} from 'lucide-react';
import {
  SocialPlatform,
  LinkedInPost,
  TwitterPost,
  InstagramPost,
  AspectRatio,
  ImageSize,
  PlatformImage
} from '../types';

interface PostCardProps {
  platform: SocialPlatform;
  postData: LinkedInPost | TwitterPost | InstagramPost | { text: string; hashtags: string[] } | undefined;
  imageData?: PlatformImage;
  onRefinePost: (platform: SocialPlatform, currentText: string, action: string, customInstruction?: string) => Promise<void>;
  onGenerateImage: (platform: SocialPlatform, prompt: string, aspectRatio: AspectRatio, size: ImageSize) => Promise<void>;
  onUpdatePostText: (platform: SocialPlatform, newText: string) => void;
  onOpenImageModal: (imageUrl: string, prompt: string) => void;
}

const PLATFORM_CONFIG: Record<
  SocialPlatform,
  { name: string; icon: string; headerGradient: string; maxChars?: number }
> = {
  linkedin: {
    name: 'LinkedIn',
    icon: '💼',
    headerGradient: 'from-blue-600 to-indigo-700',
    maxChars: 3000,
  },
  twitter: {
    name: 'Twitter / X',
    icon: '𝕏',
    headerGradient: 'from-slate-800 to-slate-950',
    maxChars: 280,
  },
  instagram: {
    name: 'Instagram',
    icon: '📸',
    headerGradient: 'from-pink-500 via-purple-500 to-amber-500',
    maxChars: 2200,
  },
  threads: {
    name: 'Threads',
    icon: '🧵',
    headerGradient: 'from-zinc-800 to-zinc-950',
    maxChars: 500,
  },
  tiktok_script: {
    name: 'Shorts / TikTok Script',
    icon: '🎵',
    headerGradient: 'from-teal-500 to-slate-900',
  },
};

const ASPECT_RATIO_OPTIONS: AspectRatio[] = [
  '1:1',
  '16:9',
  '9:16',
  '3:4',
  '4:3',
  '3:2',
  '2:3',
  '21:9',
];

const IMAGE_SIZE_OPTIONS: ImageSize[] = ['1K', '2K', '4K'];

export const PostCard: React.FC<PostCardProps> = ({
  platform,
  postData,
  imageData,
  onRefinePost,
  onGenerateImage,
  onUpdatePostText,
  onOpenImageModal,
}) => {
  const config = PLATFORM_CONFIG[platform];
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'caption' | 'thread' | 'carousel' | 'visual'>('caption');
  const [isRefining, setIsRefining] = useState(false);
  const [customRefineInput, setCustomRefineInput] = useState('');
  const [showRefineMenu, setShowRefineMenu] = useState(false);

  // Local state for image settings
  const [imagePrompt, setImagePrompt] = useState(
    imageData?.prompt ||
      (postData as any)?.suggestedVisualConcept ||
      `Professional visual concept for ${config.name} post`
  );
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>(
    imageData?.aspectRatio || (postData as any)?.recommendedAspectRatio || '1:1'
  );
  const [selectedSize, setSelectedSize] = useState<ImageSize>(
    imageData?.imageSize || '1K'
  );

  if (!postData) {
    return (
      <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-6 flex items-center justify-center text-slate-500 text-sm">
        No draft generated for {config.name}.
      </div>
    );
  }

  // Derive display text
  let mainText = '';
  if (platform === 'linkedin') {
    const li = postData as LinkedInPost;
    mainText = li.fullText || `${li.hook}\n\n${li.body}\n\n${li.callToAction}\n\n${li.hashtags?.join(' ')}`;
  } else if (platform === 'twitter') {
    const tw = postData as TwitterPost;
    mainText = tw.mainPost || (tw.thread && tw.thread[0]?.text) || '';
  } else if (platform === 'instagram') {
    const ig = postData as InstagramPost;
    const nicheTags = ig.hashtags?.niche?.join(' ') || '';
    const broadTags = ig.hashtags?.broad?.join(' ') || '';
    mainText = ig.fullCaption || `${ig.caption}\n\n${nicheTags} ${broadTags}`;
  } else {
    mainText = (postData as any).text || '';
  }

  const handleCopyText = async (textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleRefine = async (action: string) => {
    setIsRefining(true);
    setShowRefineMenu(false);
    try {
      await onRefinePost(platform, mainText, action, customRefineInput);
      setCustomRefineInput('');
    } finally {
      setIsRefining(false);
    }
  };

  const handleTriggerImageGen = async () => {
    if (!imagePrompt.trim()) return;
    await onGenerateImage(platform, imagePrompt, selectedRatio, selectedSize);
  };

  const handleDownloadImage = () => {
    if (!imageData?.url) return;
    const link = document.createElement('a');
    link.href = imageData.url;
    link.download = `${platform}-visual-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col h-full transition-all">
      {/* Card Header Banner */}
      <div className={`bg-gradient-to-r ${config.headerGradient} px-5 py-3.5 flex items-center justify-between text-white`}>
        <div className="flex items-center space-x-2.5">
          <span className="text-xl">{config.icon}</span>
          <h3 className="font-bold text-sm tracking-wide">{config.name}</h3>
        </div>

        <div className="flex items-center space-x-2">
          {/* Quick Tab Switcher if platform has thread/carousel */}
          {platform === 'twitter' && (postData as TwitterPost).type === 'thread' && (
            <div className="bg-black/30 backdrop-blur-md p-0.5 rounded-lg flex text-[11px] font-medium">
              <button
                onClick={() => setActiveTab('caption')}
                className={`px-2 py-0.5 rounded-md ${activeTab === 'caption' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'}`}
              >
                Single
              </button>
              <button
                onClick={() => setActiveTab('thread')}
                className={`px-2 py-0.5 rounded-md ${activeTab === 'thread' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'}`}
              >
                Thread ({(postData as TwitterPost).thread?.length})
              </button>
            </div>
          )}

          {platform === 'instagram' && (postData as InstagramPost).carouselOutline?.length ? (
            <div className="bg-black/30 backdrop-blur-md p-0.5 rounded-lg flex text-[11px] font-medium">
              <button
                onClick={() => setActiveTab('caption')}
                className={`px-2 py-0.5 rounded-md ${activeTab === 'caption' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'}`}
              >
                Caption
              </button>
              <button
                onClick={() => setActiveTab('carousel')}
                className={`px-2 py-0.5 rounded-md ${activeTab === 'carousel' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'}`}
              >
                Carousel Slides
              </button>
            </div>
          ) : null}

          <button
            onClick={() => handleCopyText(mainText)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white text-xs font-medium flex items-center space-x-1"
            title="Copy post content"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Card Body Content */}
      <div className="p-5 flex-1 flex flex-col space-y-5">
        {/* Main Text Content / Thread / Carousel View */}
        {activeTab === 'caption' && (
          <div className="space-y-3 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Draft Content
              </span>
              <div className="flex items-center space-x-3 text-xs">
                <span
                  className={`font-mono text-[11px] ${
                    config.maxChars && mainText.length > config.maxChars
                      ? 'text-rose-400 font-bold'
                      : 'text-slate-400'
                  }`}
                >
                  {mainText.length} {config.maxChars ? `/ ${config.maxChars}` : 'chars'}
                </span>

                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-indigo-400 hover:text-indigo-300 underline font-medium"
                >
                  {isEditing ? 'Done Editing' : 'Edit Manually'}
                </button>
              </div>
            </div>

            {isEditing ? (
              <textarea
                value={mainText}
                onChange={(e) => onUpdatePostText(platform, e.target.value)}
                className="w-full h-56 p-3 bg-slate-950 border border-indigo-500/50 rounded-xl text-slate-100 text-xs font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              />
            ) : (
              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 text-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans max-h-80 overflow-y-auto selection:bg-indigo-500/30">
                {mainText}
              </div>
            )}

            {/* AI Refine Toolbar */}
            <div className="relative pt-1">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowRefineMenu(!showRefineMenu)}
                  disabled={isRefining}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 border border-indigo-500/20 text-xs font-medium transition-colors"
                >
                  <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{isRefining ? 'Refining Post...' : 'Tweak with AI'}</span>
                </button>

                {/* Hashtag chips */}
                {platform === 'linkedin' && (postData as LinkedInPost).hashtags && (
                  <div className="flex flex-wrap gap-1 max-w-[60%] justify-end">
                    {(postData as LinkedInPost).hashtags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Refine Dropdown Menu */}
              {showRefineMenu && (
                <div className="absolute left-0 top-10 z-20 w-72 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl p-3 space-y-2 text-xs">
                  <div className="font-semibold text-slate-300 pb-1 border-b border-slate-800">
                    Quick AI Transformations
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => handleRefine('shorter')}
                      className="p-2 text-left bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-200 hover:text-white"
                    >
                      ⚡ Shorter
                    </button>
                    <button
                      onClick={() => handleRefine('longer')}
                      className="p-2 text-left bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-200 hover:text-white"
                    >
                      📈 Expand
                    </button>
                    <button
                      onClick={() => handleRefine('viral_hook')}
                      className="p-2 text-left bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-200 hover:text-white"
                    >
                      🔥 Viral Hook
                    </button>
                    <button
                      onClick={() => handleRefine('strong_cta')}
                      className="p-2 text-left bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-200 hover:text-white"
                    >
                      🎯 Strong CTA
                    </button>
                    <button
                      onClick={() => handleRefine('add_emojis')}
                      className="p-2 text-left bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-200 hover:text-white"
                    >
                      😊 Add Emojis
                    </button>
                    <button
                      onClick={() => handleRefine('remove_emojis')}
                      className="p-2 text-left bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-200 hover:text-white"
                    >
                      👔 Corporate
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-800 space-y-1.5">
                    <input
                      type="text"
                      value={customRefineInput}
                      onChange={(e) => setCustomRefineInput(e.target.value)}
                      placeholder="Custom tweak (e.g. Translate to Spanish)"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-md text-slate-100 text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      onClick={() => handleRefine('custom')}
                      disabled={!customRefineInput.trim()}
                      className="w-full py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs disabled:opacity-50"
                    >
                      Apply Custom Instruction
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Twitter Thread View */}
        {activeTab === 'thread' && platform === 'twitter' && (
          <div className="space-y-3 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Twitter Thread Sequence
              </span>
              <button
                onClick={() =>
                  handleCopyText(
                    (postData as TwitterPost).thread.map((t, idx) => `${idx + 1}/${(postData as TwitterPost).thread.length}\n${t.text}`).join('\n\n')
                  )
                }
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                Copy Entire Thread
              </button>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {(postData as TwitterPost).thread?.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 relative group"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>Tweet {idx + 1} of {(postData as TwitterPost).thread.length}</span>
                    <span className={item.text.length > 280 ? 'text-rose-400 font-bold' : ''}>
                      {item.text.length} / 280
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">{item.text}</p>
                  <button
                    onClick={() => handleCopyText(item.text)}
                    className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 p-1 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 transition-opacity text-[10px]"
                    title="Copy this tweet"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instagram Carousel Outline View */}
        {activeTab === 'carousel' && platform === 'instagram' && (
          <div className="space-y-3 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Instagram Carousel Slide Outline
              </span>
              <button
                onClick={() =>
                  handleCopyText(
                    (postData as InstagramPost).carouselOutline?.map((s, i) => `Slide ${i + 1}:\n${s}`).join('\n\n') || ''
                  )
                }
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                Copy Carousel Outline
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
              {(postData as InstagramPost).carouselOutline?.map((slideText, idx) => (
                <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <div className="text-[10px] font-bold text-pink-400 uppercase tracking-wider">
                    Slide {idx + 1} {idx === 0 ? '(Cover)' : ''}
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">{slideText}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Platform Visual & Image Section */}
        <div className="border-t border-slate-800/80 pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ImageIcon className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-semibold text-slate-300">
                Generated Visual Media
              </span>
            </div>

            {imageData?.url && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {imageData.aspectRatio} • {imageData.imageSize} Ready
              </span>
            )}
          </div>

          {/* Generated Image Preview Container */}
          {imageData?.isGenerating ? (
            <div className="w-full h-48 bg-slate-950 border border-slate-800 rounded-xl flex flex-col items-center justify-center p-4 space-y-2">
              <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              <span className="text-xs text-indigo-300 font-medium">
                Generating {selectedRatio} ({selectedSize}) studio image...
              </span>
              <span className="text-[10px] text-slate-500">
                Using gemini-3-pro-image with custom aspect ratio
              </span>
            </div>
          ) : imageData?.url ? (
            <div className="relative group bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center max-h-64">
              <img
                src={imageData.url}
                alt={`${platform} visual asset`}
                className="max-h-64 w-auto object-contain rounded-lg transition-transform duration-300 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />

              {/* Overlay controls */}
              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3 p-2">
                <button
                  onClick={() => onOpenImageModal(imageData.url!, imagePrompt)}
                  className="p-2 bg-slate-800/90 hover:bg-slate-700 text-white rounded-lg shadow-lg text-xs font-medium flex items-center space-x-1"
                >
                  <Maximize2 className="w-4 h-4" />
                  <span>Zoom</span>
                </button>
                <button
                  onClick={handleDownloadImage}
                  className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-lg text-xs font-medium flex items-center space-x-1"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/80 border border-dashed border-slate-800 rounded-xl p-4 text-center space-y-2">
              <p className="text-xs text-slate-400">No image generated yet for this post.</p>
            </div>
          )}

          {/* Image Settings Bar */}
          <div className="bg-slate-950/90 p-3 rounded-xl border border-slate-800/80 space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              {/* Aspect Ratio Picker */}
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                  Aspect Ratio
                </label>
                <select
                  value={selectedRatio}
                  onChange={(e) => setSelectedRatio(e.target.value as AspectRatio)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {ASPECT_RATIO_OPTIONS.map((ratio) => (
                    <option key={ratio} value={ratio}>
                      {ratio} {ratio === '16:9' ? '(Landscape)' : ratio === '1:1' ? '(Square)' : ratio === '9:16' ? '(Vertical)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Resolution / Image Size Picker */}
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                  Resolution / Quality
                </label>
                <select
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value as ImageSize)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {IMAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size} {size === '4K' ? '(Ultra HD)' : size === '2K' ? '(Crisp HD)' : '(Standard)'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Prompt Edit */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                Visual Concept Prompt
              </label>
              <textarea
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="Describe the image you want generated..."
                className="w-full h-16 p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
              />
            </div>

            {/* Re-generate Image Button */}
            <button
              onClick={handleTriggerImageGen}
              disabled={imageData?.isGenerating || !imagePrompt.trim()}
              className="w-full py-2 px-3 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                {imageData?.url ? 'Re-generate Image' : 'Generate Platform Image'} ({selectedRatio}, {selectedSize})
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
