import { GenerationRequest, SocialPlatform } from '../types';

export function createFallbackSvgDataUrl(prompt: string, aspectRatio: string) {
  const cleanPrompt = prompt.slice(0, 60).replace(/[^a-zA-Z0-9\s]/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#3b82f6" />
        <stop offset="50%" stop-color="#6366f1" />
        <stop offset="100%" stop-color="#8b5cf6" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#grad)" />
    <circle cx="400" cy="300" r="120" fill="rgba(255,255,255,0.12)" />
    <text x="400" y="380" font-family="system-ui, sans-serif" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle">Visual Concept Preview</text>
    <text x="400" y="440" font-family="system-ui, sans-serif" font-size="18" fill="rgba(255,255,255,0.8)" text-anchor="middle">${cleanPrompt}</text>
    <rect x="250" y="520" width="300" height="40" rx="20" fill="rgba(0,0,0,0.3)" />
    <text x="400" y="546" font-family="system-ui, sans-serif" font-size="14" fill="#ffffff" text-anchor="middle">SocialCraft AI • ${aspectRatio}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function generateClientFallbackPosts(req: GenerationRequest) {
  const idea = req.idea.trim();
  const hashtagBase = idea
    .split(" ")
    .filter((w) => w.length > 3)
    .slice(0, 3)
    .map((w) => `#${w.replace(/[^a-zA-Z0-9]/g, "")}`);

  const defaultHashtags = [...hashtagBase, "#Growth", "#ContentStrategy", "#Innovation"];
  const posts: any = {};

  if (req.selectedPlatforms.includes("linkedin")) {
    posts.linkedin = {
      hook: `🚀 The key to mastering ${idea.slice(0, 40)} isn't what most people think.`,
      body: `Here are 3 core principles to keep in mind:\n\n1️⃣ Start with clarity — focus on core value first.\n2️⃣ Consistency beats perfection every single time.\n3️⃣ Measure real impact, not vanity metrics.`,
      callToAction: `What's your biggest takeaway regarding ${idea.slice(0, 30)}? Share your thoughts below! 👇`,
      hashtags: defaultHashtags,
      fullText: `🚀 The key to mastering ${idea.slice(0, 40)} isn't what most people think.\n\nHere are 3 core principles to keep in mind:\n\n1️⃣ Start with clarity — focus on core value first.\n2️⃣ Consistency beats perfection every single time.\n3️⃣ Measure real impact, not vanity metrics.\n\nWhat's your biggest takeaway regarding ${idea.slice(0, 30)}? Share your thoughts below! 👇\n\n${defaultHashtags.join(" ")}`,
      suggestedVisualConcept: `A clean minimalist banner featuring key points about ${idea}`,
      recommendedAspectRatio: "16:9",
    };
  }

  if (req.selectedPlatforms.includes("twitter")) {
    posts.twitter = {
      type: "thread",
      mainPost: `Most people get ${idea.slice(0, 30)} wrong.\n\nHere is a simple 3-step framework to get it right: 🧵👇`,
      thread: [
        {
          id: 1,
          text: `1/ Understand the root problem: ${idea}.\nFocus on solutions that scale naturally.`,
          characterCount: 95,
        },
        {
          id: 2,
          text: `2/ Execute in small, high-impact iterations.\nSmall daily progress leads to massive compound gains over time.`,
          characterCount: 115,
        },
        {
          id: 3,
          text: `3/ Build in public and document the process.\nAuthenticity builds long-term trust and community.`,
          characterCount: 102,
        },
      ],
      hashtags: defaultHashtags.slice(0, 3),
      suggestedVisualConcept: `A sleek, high-contrast Twitter graphic illustrating ${idea}`,
      recommendedAspectRatio: "16:9",
    };
  }

  if (req.selectedPlatforms.includes("instagram")) {
    posts.instagram = {
      caption: `Unlocking the power of ${idea} ✨ Save this for later! 📌`,
      carouselOutline: [
        `Slide 1: ${idea.slice(0, 30)} — The Complete Guide`,
        `Slide 2: Step 1 — Define Your Core Goal`,
        `Slide 3: Step 2 — Optimize Your Strategy`,
        `Slide 4: Step 3 — Scale & Automate`,
        `Slide 5: Save & Share with someone who needs this!`,
      ],
      hashtags: {
        niche: defaultHashtags,
        broad: ["#ContentCreator", "#DailyTips", "#Strategy"],
      },
      fullCaption: `Unlocking the power of ${idea} ✨\n\nSave this post for later! 📌\n\nSwipe through the slides above to discover the step-by-step breakdown.\n\n${defaultHashtags.join(" ")} #ContentCreator #DailyTips`,
      suggestedVisualConcept: `A modern aesthetic square Instagram carousel cover for ${idea}`,
      recommendedAspectRatio: "1:1",
    };
  }

  if (req.selectedPlatforms.includes("threads")) {
    posts.threads = {
      text: `Honest thought on ${idea}:\n\nThe best time to start was yesterday. The second best time is right now. Keep moving forward! ✨`,
      hashtags: defaultHashtags.slice(0, 2),
    };
  }

  return posts;
}
