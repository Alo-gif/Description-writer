import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { IdeaInput } from './components/IdeaInput';
import { PostCard } from './components/PostCard';
import { DraftsModal } from './components/DraftsModal';
import { ImageModal } from './components/ImageModal';
import { BrainstormModal } from './components/BrainstormModal';
import {
  GenerationRequest,
  GenerationResult,
  SavedDraft,
  SocialPlatform,
  AspectRatio,
  ImageSize,
  PlatformImage
} from './types';
import {
  generateClientFallbackPosts,
  createFallbackSvgDataUrl
} from './utils/fallback';
import { Sparkles, Layers, RefreshCcw, Download, CheckCircle, AlertCircle } from 'lucide-react';

const STORAGE_KEY = 'socialcraft_drafts_v2';

export default function App() {
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedDrafts, setSavedDrafts] = useState<SavedDraft[]>([]);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Modals state
  const [isDraftsOpen, setIsDraftsOpen] = useState(false);
  const [isIdeasOpen, setIsIdeasOpen] = useState(false);
  const [activeImageModal, setActiveImageModal] = useState<{ url: string; prompt: string } | null>(null);

  // Load saved drafts on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSavedDrafts(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load saved drafts:', e);
    }
  }, []);

  // Save drafts helper
  const persistDrafts = (drafts: SavedDraft[]) => {
    setSavedDrafts(drafts);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
    } catch (e) {
      console.error('Failed to save drafts:', e);
    }
  };

  const showError = (msg: string) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(null), 5000);
  };

  // Primary Content & Visual Generation Handler
  const handleGenerateContent = async (req: GenerationRequest) => {
    setIsGenerating(true);
    setErrorToast(null);

    try {
      // 1. Generate text posts for requested platforms
      let generatedPosts: any = {};
      try {
        const res = await fetch('/api/generate-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req),
        });

        if (res.ok) {
          const data = await res.json();
          generatedPosts = data.posts || {};
        } else {
          generatedPosts = generateClientFallbackPosts(req);
        }
      } catch (e) {
        generatedPosts = generateClientFallbackPosts(req);
      }

      // Prepare image placeholders for each platform
      const initialImages: Record<SocialPlatform, PlatformImage> = {
        linkedin: {
          platform: 'linkedin',
          prompt: generatedPosts.linkedin?.suggestedVisualConcept || `Professional visual concept for LinkedIn post about ${req.idea}`,
          aspectRatio: generatedPosts.linkedin?.recommendedAspectRatio || '16:9',
          imageSize: req.defaultImageSize,
          isGenerating: req.selectedPlatforms.includes('linkedin'),
        },
        twitter: {
          platform: 'twitter',
          prompt: generatedPosts.twitter?.suggestedVisualConcept || `Punchy graphic concept for Twitter post about ${req.idea}`,
          aspectRatio: generatedPosts.twitter?.recommendedAspectRatio || '16:9',
          imageSize: req.defaultImageSize,
          isGenerating: req.selectedPlatforms.includes('twitter'),
        },
        instagram: {
          platform: 'instagram',
          prompt: generatedPosts.instagram?.suggestedVisualConcept || `Aesthetic visual concept for Instagram caption about ${req.idea}`,
          aspectRatio: generatedPosts.instagram?.recommendedAspectRatio || '1:1',
          imageSize: req.defaultImageSize,
          isGenerating: req.selectedPlatforms.includes('instagram'),
        },
        threads: {
          platform: 'threads',
          prompt: `Conversational image concept for Threads post about ${req.idea}`,
          aspectRatio: '1:1',
          imageSize: req.defaultImageSize,
          isGenerating: req.selectedPlatforms.includes('threads'),
        },
        tiktok_script: {
          platform: 'tiktok_script',
          prompt: `Vertical video cover concept for TikTok script about ${req.idea}`,
          aspectRatio: '9:16',
          imageSize: req.defaultImageSize,
          isGenerating: false,
        },
      };

      const newResult: GenerationResult = {
        id: `draft_${Date.now()}`,
        timestamp: Date.now(),
        idea: req.idea,
        tone: req.tone,
        customTone: req.customTone,
        posts: generatedPosts,
        images: initialImages,
      };

      setGenerationResult(newResult);

      // Save initial text draft to saved history
      const newDraft: SavedDraft = {
        ...newResult,
        title: req.idea.slice(0, 60) + (req.idea.length > 60 ? '...' : ''),
      };
      persistDrafts([newDraft, ...savedDrafts]);

      // 2. Concurrently generate platform images in background
      req.selectedPlatforms.forEach(async (platform) => {
        const imgObj = initialImages[platform];
        if (!imgObj) return;

        try {
          const imgRes = await fetch('/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: imgObj.prompt,
              aspectRatio: imgObj.aspectRatio,
              imageSize: imgObj.imageSize,
              stylePreset: req.imageStylePreset,
            }),
          });

          if (imgRes.ok) {
            const imgData = await imgRes.json();
            setGenerationResult((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                images: {
                  ...prev.images,
                  [platform]: {
                    ...prev.images[platform],
                    url: imgData.imageUrl || createFallbackSvgDataUrl(imgObj.prompt, imgObj.aspectRatio),
                    prompt: imgData.prompt || imgObj.prompt,
                    aspectRatio: imgData.aspectRatio || imgObj.aspectRatio,
                    imageSize: imgData.imageSize || imgObj.imageSize,
                    isGenerating: false,
                  },
                },
              };
            });
          } else {
            setGenerationResult((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                images: {
                  ...prev.images,
                  [platform]: {
                    ...prev.images[platform],
                    url: createFallbackSvgDataUrl(imgObj.prompt, imgObj.aspectRatio),
                    isGenerating: false,
                  },
                },
              };
            });
          }
        } catch (imgErr) {
          setGenerationResult((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              images: {
                ...prev.images,
                [platform]: {
                  ...prev.images[platform],
                  url: createFallbackSvgDataUrl(imgObj.prompt, imgObj.aspectRatio),
                  isGenerating: false,
                },
              },
            };
          });
        }
      });
    } catch (err: any) {
      console.error('Generation failed:', err);
      showError(err.message || 'Failed to generate posts. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Trigger individual Image re-generation for a platform
  const handleGenerateImage = async (
    platform: SocialPlatform,
    prompt: string,
    aspectRatio: AspectRatio,
    imageSize: ImageSize
  ) => {
    if (!generationResult) return;

    // Set generating state
    setGenerationResult((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        images: {
          ...prev.images,
          [platform]: {
            ...prev.images[platform],
            prompt,
            aspectRatio,
            imageSize,
            isGenerating: true,
            error: undefined,
          },
        },
      };
    });

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          aspectRatio,
          imageSize,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setGenerationResult((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            images: {
              ...prev.images,
              [platform]: {
                ...prev.images[platform],
                url: data.imageUrl || createFallbackSvgDataUrl(prompt, aspectRatio),
                prompt: data.prompt || prompt,
                aspectRatio: data.aspectRatio || aspectRatio,
                imageSize: data.imageSize || imageSize,
                isGenerating: false,
              },
            },
          };
        });
      } else {
        setGenerationResult((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            images: {
              ...prev.images,
              [platform]: {
                ...prev.images[platform],
                url: createFallbackSvgDataUrl(prompt, aspectRatio),
                isGenerating: false,
              },
            },
          };
        });
      }
    } catch (err: any) {
      setGenerationResult((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          images: {
            ...prev.images,
            [platform]: {
              ...prev.images[platform],
              url: createFallbackSvgDataUrl(prompt, aspectRatio),
              isGenerating: false,
            },
          },
        };
      });
    }
  };

  // Refine post text with AI
  const handleRefinePost = async (
    platform: SocialPlatform,
    currentText: string,
    action: string,
    customInstruction?: string
  ) => {
    try {
      const res = await fetch('/api/refine-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postText: currentText,
          action,
          targetPlatform: platform,
          customInstruction,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.refinedText) {
          handleUpdatePostText(platform, data.refinedText);
          return;
        }
      }
    } catch (err: any) {
      // Ignore network failure on static hosts
    }

    // Client-side fallback refinement
    let refinedText = currentText;
    if (action === 'shorter') {
      refinedText = currentText.split('\n\n').slice(0, 2).join('\n\n');
    } else if (action === 'add_emojis') {
      refinedText = `✨ ${currentText.replace(/\n/g, '\n💡 ')}`;
    } else if (action === 'strong_cta') {
      refinedText = `${currentText}\n\n👇 What do you think? Drop your thoughts in the comments below!`;
    } else if (action === 'viral_hook') {
      refinedText = `🔥 Stop scrolling. Here is what everyone gets wrong:\n\n${currentText}`;
    }
    handleUpdatePostText(platform, refinedText);
  };

  // Manual update of post text
  const handleUpdatePostText = (platform: SocialPlatform, newText: string) => {
    if (!generationResult) return;

    setGenerationResult((prev) => {
      if (!prev) return prev;
      const updatedPosts = { ...prev.posts };

      if (platform === 'linkedin' && updatedPosts.linkedin) {
        updatedPosts.linkedin = { ...updatedPosts.linkedin, fullText: newText };
      } else if (platform === 'twitter' && updatedPosts.twitter) {
        updatedPosts.twitter = { ...updatedPosts.twitter, mainPost: newText };
      } else if (platform === 'instagram' && updatedPosts.instagram) {
        updatedPosts.instagram = { ...updatedPosts.instagram, fullCaption: newText };
      } else if (platform === 'threads' && updatedPosts.threads) {
        updatedPosts.threads = { ...updatedPosts.threads, text: newText };
      }

      return {
        ...prev,
        posts: updatedPosts,
      };
    });
  };

  const handleDeleteDraft = (id: string) => {
    persistDrafts(savedDrafts.filter((d) => d.id !== id));
  };

  const handleClearAllDrafts = () => {
    if (confirm('Are you sure you want to clear all saved drafts history?')) {
      persistDrafts([]);
    }
  };

  const handleResetForm = () => {
    setGenerationResult(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Bar Header */}
      <Header
        draftsCount={savedDrafts.length}
        onOpenDrafts={() => setIsDraftsOpen(true)}
        onOpenIdeas={() => setIsIdeasOpen(true)}
        onReset={handleResetForm}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Error Toast Notification */}
        {errorToast && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-xl flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <span className="text-xs font-medium">{errorToast}</span>
            </div>
            <button
              onClick={() => setErrorToast(null)}
              className="text-rose-400 hover:text-rose-200 text-xs font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Input Form Section */}
        <section>
          <IdeaInput onSubmit={handleGenerateContent} isGenerating={isGenerating} />
        </section>

        {/* Results Workspace Display */}
        {generationResult && (
          <section className="space-y-6 pt-4 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-4 gap-2">
              <div>
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-lg font-bold text-white">Generated Content Drafts</h2>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/20 capitalize">
                    {generationResult.tone} tone
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                  Idea: "{generationResult.idea}"
                </p>
              </div>

              <div className="text-xs text-slate-500 font-mono">
                {new Date(generationResult.timestamp).toLocaleTimeString()}
              </div>
            </div>

            {/* Cross-Platform Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {generationResult.posts.linkedin && (
                <PostCard
                  platform="linkedin"
                  postData={generationResult.posts.linkedin}
                  imageData={generationResult.images.linkedin}
                  onRefinePost={handleRefinePost}
                  onGenerateImage={handleGenerateImage}
                  onUpdatePostText={handleUpdatePostText}
                  onOpenImageModal={(url, prompt) => setActiveImageModal({ url, prompt })}
                />
              )}

              {generationResult.posts.twitter && (
                <PostCard
                  platform="twitter"
                  postData={generationResult.posts.twitter}
                  imageData={generationResult.images.twitter}
                  onRefinePost={handleRefinePost}
                  onGenerateImage={handleGenerateImage}
                  onUpdatePostText={handleUpdatePostText}
                  onOpenImageModal={(url, prompt) => setActiveImageModal({ url, prompt })}
                />
              )}

              {generationResult.posts.instagram && (
                <PostCard
                  platform="instagram"
                  postData={generationResult.posts.instagram}
                  imageData={generationResult.images.instagram}
                  onRefinePost={handleRefinePost}
                  onGenerateImage={handleGenerateImage}
                  onUpdatePostText={handleUpdatePostText}
                  onOpenImageModal={(url, prompt) => setActiveImageModal({ url, prompt })}
                />
              )}

              {generationResult.posts.threads && (
                <PostCard
                  platform="threads"
                  postData={generationResult.posts.threads}
                  imageData={generationResult.images.threads}
                  onRefinePost={handleRefinePost}
                  onGenerateImage={handleGenerateImage}
                  onUpdatePostText={handleUpdatePostText}
                  onOpenImageModal={(url, prompt) => setActiveImageModal({ url, prompt })}
                />
              )}
            </div>
          </section>
        )}
      </main>

      {/* Modals */}
      <DraftsModal
        isOpen={isDraftsOpen}
        onClose={() => setIsDraftsOpen(false)}
        drafts={savedDrafts}
        onSelectDraft={(draft) => setGenerationResult(draft)}
        onDeleteDraft={handleDeleteDraft}
        onClearAllDrafts={handleClearAllDrafts}
      />

      <BrainstormModal
        isOpen={isIdeasOpen}
        onClose={() => setIsIdeasOpen(false)}
        onSelectIdea={(ideaText) => {
          // Put idea text into workspace input or launch generation
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {activeImageModal && (
        <ImageModal
          isOpen={!!activeImageModal}
          onClose={() => setActiveImageModal(null)}
          imageUrl={activeImageModal.url}
          prompt={activeImageModal.prompt}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-600">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SocialCraft AI — Powered by Gemini 3 Pro & Imagen</span>
          <span className="font-mono text-[10px] text-slate-600">
            Supports 1K, 2K, 4K Resolutions & All Aspect Ratios
          </span>
        </div>
      </footer>
    </div>
  );
}
