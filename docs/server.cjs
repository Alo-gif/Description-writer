var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "25mb" }));
function getAIClient() {
  let apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey === "MY_GEMINI_API_KEY" || apiKey.includes("MY_GEMINI") || apiKey === "dummy-key-for-init") {
    apiKey = void 0;
  }
  const options = {
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  };
  if (apiKey) {
    options.apiKey = apiKey;
  }
  return new import_genai.GoogleGenAI(options);
}
function buildContentPrompt(idea, tone, stylePreset, platforms) {
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
async function generateWithFallback(ai, candidateModels, requestParams) {
  let lastError = null;
  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: requestParams.contents,
        config: requestParams.config
      });
      return { response, modelUsed: model };
    } catch (err) {
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
var TEXT_MODEL_FALLBACKS = [
  "gemini-3.6-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.1-pro-preview"
];
var IMAGE_MODEL_FALLBACKS = [
  "gemini-3.1-flash-lite-image",
  "gemini-3.1-flash-image",
  "gemini-3-pro-image"
];
function generateFallbackPosts(idea, tone, selectedPlatforms) {
  const cleanIdea = idea.trim();
  const hashtagBase = cleanIdea.split(" ").filter((w) => w.length > 3).slice(0, 3).map((w) => `#${w.replace(/[^a-zA-Z0-0]/g, "")}`);
  const defaultHashtags = [...hashtagBase, "#Growth", "#ContentStrategy", "#Innovation"];
  const posts = {};
  if (selectedPlatforms.includes("linkedin")) {
    posts.linkedin = {
      hook: `\u{1F680} The key to mastering ${cleanIdea.slice(0, 40)} isn't what most people think.`,
      body: `Here are 3 core principles to keep in mind:

1\uFE0F\u20E3 Start with clarity \u2014 focus on core value first.
2\uFE0F\u20E3 Consistency beats perfection every single time.
3\uFE0F\u20E3 Measure real impact, not vanity metrics.`,
      callToAction: `What's your biggest takeaway regarding ${cleanIdea.slice(0, 30)}? Share your thoughts below! \u{1F447}`,
      hashtags: defaultHashtags,
      fullText: `\u{1F680} The key to mastering ${cleanIdea.slice(0, 40)} isn't what most people think.

Here are 3 core principles to keep in mind:

1\uFE0F\u20E3 Start with clarity \u2014 focus on core value first.
2\uFE0F\u20E3 Consistency beats perfection every single time.
3\uFE0F\u20E3 Measure real impact, not vanity metrics.

What's your biggest takeaway regarding ${cleanIdea.slice(0, 30)}? Share your thoughts below! \u{1F447}

${defaultHashtags.join(" ")}`,
      suggestedVisualConcept: `A clean minimalist banner featuring key points about ${cleanIdea}`,
      recommendedAspectRatio: "16:9"
    };
  }
  if (selectedPlatforms.includes("twitter")) {
    posts.twitter = {
      type: "thread",
      mainPost: `Most people get ${cleanIdea.slice(0, 30)} wrong.

Here is a simple 3-step framework to get it right: \u{1F9F5}\u{1F447}`,
      thread: [
        {
          id: 1,
          text: `1/ Understand the root problem: ${cleanIdea}.
Focus on solutions that scale naturally.`,
          characterCount: 95
        },
        {
          id: 2,
          text: `2/ Execute in small, high-impact iterations.
Small daily progress leads to massive compound gains over time.`,
          characterCount: 115
        },
        {
          id: 3,
          text: `3/ Build in public and document the process.
Authenticity builds long-term trust and community.`,
          characterCount: 102
        }
      ],
      hashtags: defaultHashtags.slice(0, 3),
      suggestedVisualConcept: `A sleek, high-contrast Twitter graphic illustrating ${cleanIdea}`,
      recommendedAspectRatio: "16:9"
    };
  }
  if (selectedPlatforms.includes("instagram")) {
    posts.instagram = {
      caption: `Unlocking the power of ${cleanIdea} \u2728 Save this for later! \u{1F4CC}`,
      carouselOutline: [
        `Slide 1: ${cleanIdea.slice(0, 30)} \u2014 The Complete Guide`,
        `Slide 2: Step 1 \u2014 Define Your Core Goal`,
        `Slide 3: Step 2 \u2014 Optimize Your Strategy`,
        `Slide 4: Step 3 \u2014 Scale & Automate`,
        `Slide 5: Save & Share with someone who needs this!`
      ],
      hashtags: {
        niche: defaultHashtags,
        broad: ["#ContentCreator", "#DailyTips", "#Strategy"]
      },
      fullCaption: `Unlocking the power of ${cleanIdea} \u2728

Save this post for later! \u{1F4CC}

Swipe through the slides above to discover the step-by-step breakdown.

${defaultHashtags.join(" ")} #ContentCreator #DailyTips`,
      suggestedVisualConcept: `A modern aesthetic square Instagram carousel cover for ${cleanIdea}`,
      recommendedAspectRatio: "1:1"
    };
  }
  if (selectedPlatforms.includes("threads")) {
    posts.threads = {
      text: `Honest thought on ${cleanIdea}:

The best time to start was yesterday. The second best time is right now. Keep moving forward! \u2728`,
      hashtags: defaultHashtags.slice(0, 2)
    };
  }
  return posts;
}
app.post("/api/generate-content", async (req, res) => {
  try {
    const {
      idea,
      tone,
      customTone,
      selectedPlatforms = ["linkedin", "twitter", "instagram"],
      imageStylePreset = "modern_minimalist",
      referenceImageBase64
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
    const contents = [];
    if (referenceImageBase64) {
      const match = referenceImageBase64.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        contents.push({
          inlineData: {
            mimeType: match[1],
            data: match[2]
          }
        });
      }
    }
    contents.push({ text: promptText });
    const { response } = await generateWithFallback(ai, TEXT_MODEL_FALLBACKS, {
      contents,
      config: {
        systemInstruction: "You are an expert social media copywriter. Generate structured social media posts in clean JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai.Type.OBJECT,
          properties: {
            linkedin: {
              type: import_genai.Type.OBJECT,
              properties: {
                hook: { type: import_genai.Type.STRING },
                body: { type: import_genai.Type.STRING },
                callToAction: { type: import_genai.Type.STRING },
                hashtags: { type: import_genai.Type.ARRAY, items: { type: import_genai.Type.STRING } },
                fullText: { type: import_genai.Type.STRING },
                suggestedVisualConcept: { type: import_genai.Type.STRING },
                recommendedAspectRatio: { type: import_genai.Type.STRING }
              },
              required: ["hook", "body", "callToAction", "hashtags", "fullText", "suggestedVisualConcept"]
            },
            twitter: {
              type: import_genai.Type.OBJECT,
              properties: {
                type: { type: import_genai.Type.STRING, description: "'single' or 'thread'" },
                mainPost: { type: import_genai.Type.STRING },
                thread: {
                  type: import_genai.Type.ARRAY,
                  items: {
                    type: import_genai.Type.OBJECT,
                    properties: {
                      id: { type: import_genai.Type.INTEGER },
                      text: { type: import_genai.Type.STRING },
                      characterCount: { type: import_genai.Type.INTEGER }
                    },
                    required: ["id", "text", "characterCount"]
                  }
                },
                hashtags: { type: import_genai.Type.ARRAY, items: { type: import_genai.Type.STRING } },
                suggestedVisualConcept: { type: import_genai.Type.STRING },
                recommendedAspectRatio: { type: import_genai.Type.STRING }
              },
              required: ["type", "mainPost", "thread", "hashtags", "suggestedVisualConcept"]
            },
            instagram: {
              type: import_genai.Type.OBJECT,
              properties: {
                caption: { type: import_genai.Type.STRING },
                carouselOutline: { type: import_genai.Type.ARRAY, items: { type: import_genai.Type.STRING } },
                hashtags: {
                  type: import_genai.Type.OBJECT,
                  properties: {
                    niche: { type: import_genai.Type.ARRAY, items: { type: import_genai.Type.STRING } },
                    broad: { type: import_genai.Type.ARRAY, items: { type: import_genai.Type.STRING } }
                  },
                  required: ["niche", "broad"]
                },
                fullCaption: { type: import_genai.Type.STRING },
                suggestedVisualConcept: { type: import_genai.Type.STRING },
                recommendedAspectRatio: { type: import_genai.Type.STRING }
              },
              required: ["caption", "carouselOutline", "hashtags", "fullCaption", "suggestedVisualConcept"]
            },
            threads: {
              type: import_genai.Type.OBJECT,
              properties: {
                text: { type: import_genai.Type.STRING },
                hashtags: { type: import_genai.Type.ARRAY, items: { type: import_genai.Type.STRING } }
              },
              required: ["text", "hashtags"]
            }
          }
        }
      }
    });
    const jsonText = response.text || "{}";
    const parsedPosts = JSON.parse(jsonText);
    return res.json({
      posts: parsedPosts,
      timestamp: Date.now()
    });
  } catch (err) {
    const { idea, tone, selectedPlatforms = ["linkedin", "twitter", "instagram"] } = req.body || {};
    const fallbackPosts = generateFallbackPosts(idea || "Social Media Strategy", tone || "professional", selectedPlatforms);
    return res.json({
      posts: fallbackPosts,
      timestamp: Date.now(),
      isFallback: true,
      notice: "Generated structured content draft."
    });
  }
});
function createFallbackSvgDataUrl(prompt, aspectRatio) {
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
    <text x="400" y="546" font-family="system-ui, sans-serif" font-size="14" fill="#ffffff" text-anchor="middle">SocialCraft AI \u2022 ${aspectRatio}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
app.post("/api/generate-image", async (req, res) => {
  const {
    prompt,
    aspectRatio = "1:1",
    imageSize = "1K",
    stylePreset = "modern_minimalist",
    modelOverride
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
    const styleDescriptions = {
      modern_minimalist: "Modern minimalist clean studio layout, elegant lighting, subtle gradients, high resolution, editorial design",
      photorealistic_corporate: "Photorealistic 8k studio shot, professional photography, natural cinematic lighting, sharp detail",
      vibrant_illustration: "Vibrant high-end digital illustration, rich color contrast, vector art style, expressive composition",
      abstract_3d: "Abstract 3D render, smooth translucent glass and clay textures, soft pastel shadows, Octane render quality",
      cyberpunk_neon: "Futuristic cyberpunk aesthetic, high-contrast neon blues and purples, glowing lights, dramatic night contrast",
      retro_editorial: "Vintage retro editorial graphic design, classic typography feel, film grain, analog aesthetic",
      cinematic_photo: "Cinematic wide frame, dramatic filmic color grading, bokeh background, photorealistic texture"
    };
    const styleAddition = styleDescriptions[stylePreset] || styleDescriptions.modern_minimalist;
    const finalPrompt = `${prompt}. Visual Style: ${styleAddition}. Ensure high clarity and professional composition without text clutter.`;
    const candidateImageModels = modelOverride ? [modelOverride, ...IMAGE_MODEL_FALLBACKS.filter((m) => m !== modelOverride)] : IMAGE_MODEL_FALLBACKS;
    const { response } = await generateWithFallback(ai, candidateImageModels, {
      contents: {
        parts: [{ text: finalPrompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: normalizedRatio,
          imageSize: normalizedSize
        }
      }
    });
    let imageUrl = null;
    let returnedText = null;
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
      imageSize: normalizedSize
    });
  } catch (err) {
    return res.json({
      imageUrl: createFallbackSvgDataUrl(prompt, normalizedRatio),
      prompt,
      aspectRatio: normalizedRatio,
      imageSize: normalizedSize,
      isFallback: true
    });
  }
});
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
      contents: `Original Post for ${targetPlatform || "social media"}:
"""
${postText}
"""

Task: ${instruction}

Return ONLY the revised post text ready to copy-paste. Do not include introductory conversational filler.`
    });
    return res.json({
      refinedText: response.text?.trim() || postText
    });
  } catch (err) {
    let refinedText = postText;
    if (action === "shorter") {
      refinedText = postText.split("\n\n").slice(0, 2).join("\n\n");
    } else if (action === "add_emojis") {
      refinedText = `\u2728 ${postText.replace(/\n/g, "\n\u{1F4A1} ")}`;
    } else if (action === "strong_cta") {
      refinedText = `${postText}

\u{1F447} What do you think? Drop your thoughts in the comments below!`;
    } else if (action === "viral_hook") {
      refinedText = `\u{1F525} Stop scrolling. Here is what everyone gets wrong:

${postText}`;
    }
    return res.json({ refinedText });
  }
});
app.post("/api/suggest-ideas", async (req, res) => {
  try {
    const { topic } = req.body;
    const ai = getAIClient();
    const { response } = await generateWithFallback(ai, TEXT_MODEL_FALLBACKS, {
      contents: `Give 5 viral, engaging social media post angles for the topic or industry: "${topic || "Tech & Innovation"}". Return a JSON array of strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai.Type.ARRAY,
          items: { type: import_genai.Type.STRING }
        }
      }
    });
    const ideas = JSON.parse(response.text || "[]");
    return res.json({ ideas });
  } catch (err) {
    return res.json({
      ideas: [
        "3 practical ways to level up your workflow today",
        "The biggest misconception in this industry (and what to do instead)",
        "How we scaled from idea to execution in 30 days",
        "5 essential tools every creator needs in 2026",
        "Why simplicity always wins over complex strategy"
      ]
    });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
