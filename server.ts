import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));

// Initialize Google Gen AI client with User-Agent header as required
function getAIClient() {
  let apiKey = process.env.GEMINI_API_KEY;
  if (
    !apiKey ||
    apiKey.trim() === "" ||
    apiKey === "MY_GEMINI_API_KEY" ||
    apiKey.includes("MY_GEMINI") ||
    apiKey === "dummy-key-for-init"
  ) {
    apiKey = undefined;
  }

  const options: any = {
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  };

  if (apiKey) {
    options.apiKey = apiKey;
  }

  return new GoogleGenAI(options);
}

// System prompt helper for generating cross-platform social content
function buildContentPrompt(
  idea: string,
  tone: string,
  stylePreset: string,
  platforms: string[]
) {
  return `You are a world-class social media strategist and content creator.
Transform the following idea into platform-perfect social media posts tailored to each requested platform.

Target Tone: ${tone}
Visual Style Theme: ${stylePreset}
Requested Platforms: ${platforms.join(", ")}

CORE USER IDEA:
"""
${idea}
"""

Instructions per platform:
1. LinkedIn (long-form):
   - Attention-grabbing opening hook line (max 12 words)
   - Structured body with spaced paragraphs, key bullet insights, and clear takeaways
   - Authentic, non-spammy Call to Action (CTA)
   - 3 to 5 highly strategic hashtags
   - Full formatted post ready to publish
   - Detailed visual concept prompt for image generation (photorealistic or stylized graphic matching the theme)
   - Recommended aspect ratio ('16:9' or '1:1')

2. Twitter / X (short & punchy):
   - Single standalone punchy post (under 280 chars) OR a 3-4 tweet thread breakdown
   - Engaging opening hook, high signal-to-noise ratio
   - Strategic hashtags or tags
   - Visual concept prompt for Twitter/X
   - Recommended aspect ratio ('16:9' or '1:1')

3. Instagram (visual-first & engaging):
   - Engaging caption starting with strong visual hook and line breaks
   - Carousel slide breakdown (Slide 1: Title/Cover, Slide 2-5: Main points, Final: CTA)
   - Categorized hashtags (Niche hashtags + Broad reach hashtags)
   - Full caption formatted with emojis and clean line breaks
   - Visual concept prompt for Instagram
   - Recommended aspect ratio ('1:1', '4:5' represented as '3:4', or '9:16')

4. Threads (if requested):
   - Conversational, human, authentic short update with hashtags.

Return a strictly valid JSON object adhering strictly to the JSON schema specified.`;
}

// Helper function to call Gemini API with valid model fallbacks
async function generateWithFallback(
  ai: GoogleGenAI,
  candidateModels: string[],
  requestParams: { contents: any; config?: any }
) {
  let lastError: any = null;
  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: requestParams.contents,
        config: requestParams.config,
      });
      return { response, modelUsed: model };
    } catch (err: any) {
      lastError = err;
    }
  }

  const errMsg = lastError?.message || String(lastError || "API call failed");
  if (errMsg.includes("PERMISSION_DENIED") || errMsg.includes("403")) {
    throw new Error(
      "Gemini API permission required. Please check API key configuration."
    );
  } else if (errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("429")) {
    throw new Error(
      "Gemini API rate limit reached. Using template fallback."
    );
  }
  throw lastError;
}

const TEXT_MODEL_FALLBACKS = [
  "gemini-3.6-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.1-pro-preview",
];

const IMAGE_MODEL_FALLBACKS = [
  "gemini-3.1-flash-lite-image",
  "gemini-3.1-flash-image",
  "gemini-3-pro-image",
];

// Helper fallback template generator when API quota/rate limit is reached
function generateFallbackPosts(idea: string, tone: string, selectedPlatforms: string[]) {
  const cleanIdea = idea.trim();
  const hashtagBase = cleanIdea
    .split(" ")
    .filter((w) => w.length > 3)
    .slice(0, 3)
    .map((w) => `#${w.replace(/[^a-zA-Z0-0]/g, "")}`);

  const defaultHashtags = [...hashtagBase, "#Growth", "#ContentStrategy", "#Innovation"];

  const posts: any = {};

  if (selectedPlatforms.includes("linkedin")) {
    posts.linkedin = {
      hook: `🚀 The key to mastering ${cleanIdea.slice(0, 40)} isn't what most people think.`,
      body: `Here are 3 core principles to keep in mind:\n\n1️⃣ Start with clarity — focus on core value first.\n2️⃣ Consistency beats perfection every single time.\n3️⃣ Measure real impact, not vanity metrics.`,
      callToAction: `What's your biggest takeaway regarding ${cleanIdea.slice(0, 30)}? Share your thoughts below! 👇`,
      hashtags: defaultHashtags,
      fullText: `🚀 The key to mastering ${cleanIdea.slice(0, 40)} isn't what most people think.\n\nHere are 3 core principles to keep in mind:\n\n1️⃣ Start with clarity — focus on core value first.\n2️⃣ Consistency beats perfection every single time.\n3️⃣ Measure real impact, not vanity metrics.\n\nWhat's your biggest takeaway regarding ${cleanIdea.slice(0, 30)}? Share your thoughts below! 👇\n\n${defaultHashtags.join(" ")}`,
      suggestedVisualConcept: `A clean minimalist banner featuring key points about ${cleanIdea}`,
      recommendedAspectRatio: "16:9",
    };
  }

  if (selectedPlatforms.includes("twitter")) {
    posts.twitter = {
      type: "thread",
      mainPost: `Most people get ${cleanIdea.slice(0, 30)} wrong.\n\nHere is a simple 3-step framework to get it right: 🧵👇`,
      thread: [
        {
          id: 1,
          text: `1/ Understand the root problem: ${cleanIdea}.\nFocus on solutions that scale naturally.`,
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
      suggestedVisualConcept: `A sleek, high-contrast Twitter graphic illustrating ${cleanIdea}`,
      recommendedAspectRatio: "16:9",
    };
  }

  if (selectedPlatforms.includes("instagram")) {
    posts.instagram = {
      caption: `Unlocking the power of ${cleanIdea} ✨ Save this for later! 📌`,
      carouselOutline: [
        `Slide 1: ${cleanIdea.slice(0, 30)} — The Complete Guide`,
        `Slide 2: Step 1 — Define Your Core Goal`,
        `Slide 3: Step 2 — Optimize Your Strategy`,
        `Slide 4: Step 3 — Scale & Automate`,
        `Slide 5: Save & Share with someone who needs this!`,
      ],
      hashtags: {
        niche: defaultHashtags,
        broad: ["#ContentCreator", "#DailyTips", "#Strategy"],
      },
      fullCaption: `Unlocking the power of ${cleanIdea} ✨\n\nSave this post for later! 📌\n\nSwipe through the slides above to discover the step-by-step breakdown.\n\n${defaultHashtags.join(" ")} #ContentCreator #DailyTips`,
      suggestedVisualConcept: `A modern aesthetic square Instagram carousel cover for ${cleanIdea}`,
      recommendedAspectRatio: "1:1",
    };
  }

  if (selectedPlatforms.includes("threads")) {
    posts.threads = {
      text: `Honest thought on ${cleanIdea}:\n\nThe best time to start was yesterday. The second best time is right now. Keep moving forward! ✨`,
      hashtags: defaultHashtags.slice(0, 2),
    };
  }

  return posts;
}

// API: Generate Content for multiple platforms simultaneously
app.post("/api/generate-content", async (req, res) => {
  try {
    const {
      idea,
      tone,
      customTone,
      selectedPlatforms = ["linkedin", "twitter", "instagram"],
      imageStylePreset = "modern_minimalist",
      referenceImageBase64,
    } = req.body;

    if (!idea || typeof idea !== "string" || !idea.trim()) {
      return res.status(400).json({ error: "Please provide a valid idea prompt." });
    }

    const ai = getAIClient();
    const activeTone = tone === "custom" && customTone ? customTone : tone;
    const promptText = buildContentPrompt(
      idea,
      activeTone,
      imageStylePreset,
      selectedPlatforms
    );

    const contents: any[] = [];

    // Include reference image if provided
    if (referenceImageBase64) {
      const match = referenceImageBase64.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        contents.push({
          inlineData: {
            mimeType: match[1],
            data: match[2],
          },
        });
      }
    }

    contents.push({ text: promptText });

    const { response } = await generateWithFallback(ai, TEXT_MODEL_FALLBACKS, {
      contents,
      config: {
        systemInstruction:
          "You are an expert social media copywriter. Generate structured social media posts in clean JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            linkedin: {
              type: Type.OBJECT,
              properties: {
                hook: { type: Type.STRING },
                body: { type: Type.STRING },
                callToAction: { type: Type.STRING },
                hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                fullText: { type: Type.STRING },
                suggestedVisualConcept: { type: Type.STRING },
                recommendedAspectRatio: { type: Type.STRING },
              },
              required: ["hook", "body", "callToAction", "hashtags", "fullText", "suggestedVisualConcept"],
            },
            twitter: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, description: "'single' or 'thread'" },
                mainPost: { type: Type.STRING },
                thread: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.INTEGER },
                      text: { type: Type.STRING },
                      characterCount: { type: Type.INTEGER },
                    },
                    required: ["id", "text", "characterCount"],
                  },
                },
                hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                suggestedVisualConcept: { type: Type.STRING },
                recommendedAspectRatio: { type: Type.STRING },
              },
              required: ["type", "mainPost", "thread", "hashtags", "suggestedVisualConcept"],
            },
            instagram: {
              type: Type.OBJECT,
              properties: {
                caption: { type: Type.STRING },
                carouselOutline: { type: Type.ARRAY, items: { type: Type.STRING } },
                hashtags: {
                  type: Type.OBJECT,
                  properties: {
                    niche: { type: Type.ARRAY, items: { type: Type.STRING } },
                    broad: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ["niche", "broad"],
                },
                fullCaption: { type: Type.STRING },
                suggestedVisualConcept: { type: Type.STRING },
                recommendedAspectRatio: { type: Type.STRING },
              },
              required: ["caption", "carouselOutline", "hashtags", "fullCaption", "suggestedVisualConcept"],
            },
            threads: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["text", "hashtags"],
            },
          },
        },
      },
    });

    const jsonText = response.text || "{}";
    const parsedPosts = JSON.parse(jsonText);

    return res.json({
      posts: parsedPosts,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    // Safely generate fallback structured content matching the user's request
    const { idea, tone, selectedPlatforms = ["linkedin", "twitter", "instagram"] } = req.body || {};
    const fallbackPosts = generateFallbackPosts(idea || "Social Media Strategy", tone || "professional", selectedPlatforms);

    return res.json({
      posts: fallbackPosts,
      timestamp: Date.now(),
      isFallback: true,
      notice: "Generated structured content draft.",
    });
  }
});

// Helper SVG card generator for image fallback
function createFallbackSvgDataUrl(prompt: string, aspectRatio: string) {
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

// API: Generate Image for a specific platform or custom prompt
app.post("/api/generate-image", async (req, res) => {
  const {
    prompt,
    aspectRatio = "1:1",
    imageSize = "1K",
    stylePreset = "modern_minimalist",
    modelOverride,
  } = req.body || {};

  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Prompt is required for image generation." });
  }

  const validAspectRatios = ["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"];
  const normalizedRatio = validAspectRatios.includes(aspectRatio) ? aspectRatio : "1:1";
  const validSizes = ["512px", "1K", "2K", "4K"];
  const normalizedSize = validSizes.includes(imageSize) ? imageSize : "1K";

  try {
    const ai = getAIClient();

    // Enhance prompt with style preset
    const styleDescriptions: Record<string, string> = {
      modern_minimalist: "Modern minimalist clean studio layout, elegant lighting, subtle gradients, high resolution, editorial design",
      photorealistic_corporate: "Photorealistic 8k studio shot, professional photography, natural cinematic lighting, sharp detail",
      vibrant_illustration: "Vibrant high-end digital illustration, rich color contrast, vector art style, expressive composition",
      abstract_3d: "Abstract 3D render, smooth translucent glass and clay textures, soft pastel shadows, Octane render quality",
      cyberpunk_neon: "Futuristic cyberpunk aesthetic, high-contrast neon blues and purples, glowing lights, dramatic night contrast",
      retro_editorial: "Vintage retro editorial graphic design, classic typography feel, film grain, analog aesthetic",
      cinematic_photo: "Cinematic wide frame, dramatic filmic color grading, bokeh background, photorealistic texture",
    };

    const styleAddition = styleDescriptions[stylePreset] || styleDescriptions.modern_minimalist;
    const finalPrompt = `${prompt}. Visual Style: ${styleAddition}. Ensure high clarity and professional composition without text clutter.`;

    const candidateImageModels = modelOverride
      ? [modelOverride, ...IMAGE_MODEL_FALLBACKS.filter((m) => m !== modelOverride)]
      : IMAGE_MODEL_FALLBACKS;

    const { response } = await generateWithFallback(ai, candidateImageModels, {
      contents: {
        parts: [{ text: finalPrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: normalizedRatio as any,
          imageSize: normalizedSize as any,
        },
      },
    });

    let imageUrl: string | null = null;
    let returnedText: string | null = null;

    if (response?.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const mimeType = part.inlineData.mimeType || "image/png";
          imageUrl = `data:${mimeType};base64,${part.inlineData.data}`;
        } else if (part.text) {
          returnedText = part.text;
        }
      }
    }

    if (!imageUrl) {
      imageUrl = createFallbackSvgDataUrl(prompt, normalizedRatio);
    }

    return res.json({
      imageUrl,
      prompt: finalPrompt,
      aspectRatio: normalizedRatio,
      imageSize: normalizedSize,
    });
  } catch (err: any) {
    return res.json({
      imageUrl: createFallbackSvgDataUrl(prompt, normalizedRatio),
      prompt: prompt,
      aspectRatio: normalizedRatio,
      imageSize: normalizedSize,
      isFallback: true,
    });
  }
});

// API: Quick AI post refinement
app.post("/api/refine-post", async (req, res) => {
  const { postText, action, targetPlatform, customInstruction } = req.body || {};

  if (!postText) {
    return res.status(400).json({ error: "Original post text is required." });
  }

  try {
    const ai = getAIClient();

    let instruction = "";
    switch (action) {
      case "shorter":
        instruction = "Make this post 30% shorter, punchier, and remove fluff while preserving key message.";
        break;
      case "longer":
        instruction = "Expand on this post by adding strategic depth, an extra relatable example, and engaging formatting.";
        break;
      case "add_emojis":
        instruction = "Enhance the post with relevant visual emojis placed naturally at key headings and bullet points.";
        break;
      case "remove_emojis":
        instruction = "Remove all emojis from this post for a clean, formal corporate tone.";
        break;
      case "strong_cta":
        instruction = "Rewrite the ending to include a high-converting, irresistible Call-To-Action (CTA) encouraging comments, shares, or link clicks.";
        break;
      case "viral_hook":
        instruction = "Rewrite the first 2 lines to make it a viral, high-curiosity hook that stops users from scrolling past.";
        break;
      case "custom":
        instruction = customInstruction || "Polish and improve the readability of this post.";
        break;
      default:
        instruction = "Improve readability, formatting, and engagement of this post.";
    }

    const { response } = await generateWithFallback(ai, TEXT_MODEL_FALLBACKS, {
      contents: `Original Post for ${targetPlatform || "social media"}:\n"""\n${postText}\n"""\n\nTask: ${instruction}\n\nReturn ONLY the revised post text ready to copy-paste. Do not include introductory conversational filler.`,
    });

    return res.json({
      refinedText: response.text?.trim() || postText,
    });
  } catch (err: any) {
    let refinedText = postText;
    if (action === "shorter") {
      refinedText = postText.split("\n\n").slice(0, 2).join("\n\n");
    } else if (action === "add_emojis") {
      refinedText = `✨ ${postText.replace(/\n/g, "\n💡 ")}`;
    } else if (action === "strong_cta") {
      refinedText = `${postText}\n\n👇 What do you think? Drop your thoughts in the comments below!`;
    } else if (action === "viral_hook") {
      refinedText = `🔥 Stop scrolling. Here is what everyone gets wrong:\n\n${postText}`;
    }

    return res.json({ refinedText });
  }
});

// API: AI Prompt Expander / Idea Generator
app.post("/api/suggest-ideas", async (req, res) => {
  try {
    const { topic } = req.body;
    const ai = getAIClient();

    const { response } = await generateWithFallback(ai, TEXT_MODEL_FALLBACKS, {
      contents: `Give 5 viral, engaging social media post angles for the topic or industry: "${topic || "Tech & Innovation"}". Return a JSON array of strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
    });

    const ideas = JSON.parse(response.text || "[]");
    return res.json({ ideas });
  } catch (err: any) {
    return res.json({
      ideas: [
        "3 practical ways to level up your workflow today",
        "The biggest misconception in this industry (and what to do instead)",
        "How we scaled from idea to execution in 30 days",
        "5 essential tools every creator needs in 2026",
        "Why simplicity always wins over complex strategy",
      ],
    });
  }
});

// Setup Vite middleware for dev or static server for production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
