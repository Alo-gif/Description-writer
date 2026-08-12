export type SocialPlatform = 'linkedin' | 'twitter' | 'instagram' | 'threads' | 'tiktok_script';

export type Tone = 
  | 'professional'
  | 'witty'
  | 'urgent'
  | 'thought_leader'
  | 'bold'
  | 'enthusiastic'
  | 'empathetic'
  | 'casual'
  | 'custom';

export type AspectRatio = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '9:16' | '16:9' | '21:9';

export type ImageSize = '1K' | '2K' | '4K';

export type ImageStylePreset = 
  | 'modern_minimalist'
  | 'photorealistic_corporate'
  | 'vibrant_illustration'
  | 'abstract_3d'
  | 'cyberpunk_neon'
  | 'retro_editorial'
  | 'cinematic_photo';

export interface LinkedInPost {
  hook: string;
  body: string;
  callToAction: string;
  hashtags: string[];
  fullText: string;
  suggestedVisualConcept: string;
  recommendedAspectRatio: AspectRatio;
}

export interface TwitterThreadItem {
  id: number;
  text: string;
  characterCount: number;
}

export interface TwitterPost {
  type: 'single' | 'thread';
  mainPost: string;
  thread: TwitterThreadItem[];
  hashtags: string[];
  suggestedVisualConcept: string;
  recommendedAspectRatio: AspectRatio;
}

export interface InstagramPost {
  caption: string;
  carouselOutline?: string[];
  hashtags: {
    niche: string[];
    broad: string[];
  };
  fullCaption: string;
  suggestedVisualConcept: string;
  recommendedAspectRatio: AspectRatio;
}

export interface PlatformPosts {
  linkedin?: LinkedInPost;
  twitter?: TwitterPost;
  instagram?: InstagramPost;
  threads?: {
    text: string;
    hashtags: string[];
  };
}

export interface PlatformImage {
  platform: SocialPlatform;
  url?: string;
  prompt: string;
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
  isGenerating: boolean;
  error?: string;
}

export interface GenerationResult {
  id: string;
  timestamp: number;
  idea: string;
  tone: Tone;
  customTone?: string;
  posts: PlatformPosts;
  images: Record<SocialPlatform, PlatformImage>;
}

export interface GenerationRequest {
  idea: string;
  tone: Tone;
  customTone?: string;
  selectedPlatforms: SocialPlatform[];
  imageStylePreset: ImageStylePreset;
  defaultAspectRatio: AspectRatio;
  defaultImageSize: ImageSize;
  referenceImageBase64?: string;
}

export interface SavedDraft extends GenerationResult {
  title: string;
  favorite?: boolean;
}
