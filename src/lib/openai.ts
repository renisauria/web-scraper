import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export type AnalysisType =
  | "marketing"
  | "techstack"
  | "architecture"
  | "performance"
  | "recommendations";

const analysisPrompts: Record<AnalysisType, string> = {
  marketing: `You are a marketing strategist analyzing a website. Analyze the provided website content and provide a detailed marketing analysis in JSON format with the following structure:
{
  "seo": {
    "score": number (1-10),
    "findings": string[],
    "improvements": string[]
  },
  "ctas": {
    "found": string[],
    "effectiveness": string,
    "suggestions": string[]
  },
  "valueProposition": {
    "identified": string,
    "clarity": string,
    "improvements": string[]
  },
  "messaging": {
    "tone": string,
    "consistency": string,
    "targetAudience": string,
    "suggestions": string[]
  },
  "conversionOptimization": {
    "currentScore": number (1-10),
    "opportunities": string[]
  },
  "summary": string
}`,

  techstack: `You are a technical analyst examining a website. Analyze the provided website content and identify the technology stack in JSON format:
{
  "frameworks": {
    "frontend": string[],
    "backend": string[],
    "evidence": string[]
  },
  "cms": {
    "identified": string | null,
    "confidence": string
  },
  "analytics": string[],
  "thirdPartyTools": {
    "name": string,
    "purpose": string
  }[],
  "hosting": {
    "indicators": string[],
    "likelyProvider": string
  },
  "buildTools": string[],
  "performance": {
    "optimizations": string[],
    "concerns": string[]
  },
  "summary": string
}`,

  architecture: `You are a web architect analyzing site structure. Analyze the provided website content and map the architecture in JSON format:
{
  "siteStructure": {
    "mainSections": string[],
    "hierarchy": string,
    "depth": number
  },
  "navigation": {
    "type": string,
    "items": string[],
    "usability": string
  },
  "pageHierarchy": {
    "topLevel": string[],
    "subPages": { parent: string, children: string[] }[]
  },
  "urlStructure": {
    "pattern": string,
    "seoFriendly": boolean,
    "suggestions": string[]
  },
  "contentOrganization": {
    "strengths": string[],
    "weaknesses": string[],
    "recommendations": string[]
  },
  "summary": string
}`,

  performance: `You are a performance analyst examining a website. Analyze the provided website content for performance indicators in JSON format:
{
  "pageSpeed": {
    "indicators": string[],
    "concerns": string[]
  },
  "mobileResponsiveness": {
    "indicators": string[],
    "score": number (1-10)
  },
  "assetOptimization": {
    "images": string,
    "scripts": string,
    "styles": string
  },
  "coreWebVitals": {
    "predictions": string[]
  },
  "recommendations": {
    "immediate": string[],
    "longTerm": string[]
  },
  "summary": string
}`,

  recommendations: `You are a digital strategy consultant. Based on the provided website content, provide prioritized improvement recommendations in JSON format:
{
  "quickWins": {
    "items": { title: string, description: string, impact: string, effort: string }[],
    "timeframe": string
  },
  "strategicChanges": {
    "items": { title: string, description: string, impact: string, effort: string }[],
    "timeframe": string
  },
  "technicalDebt": {
    "items": { issue: string, priority: string, recommendation: string }[]
  },
  "priorityMatrix": {
    "highImpactLowEffort": string[],
    "highImpactHighEffort": string[],
    "lowImpactLowEffort": string[],
    "lowImpactHighEffort": string[]
  },
  "roadmap": {
    "phase1": string[],
    "phase2": string[],
    "phase3": string[]
  },
  "summary": string
}`,
};

export interface AnalysisResult {
  success: boolean;
  type: AnalysisType;
  content: Record<string, unknown>;
  error?: string;
}

export async function analyzeContent(
  content: string,
  type: AnalysisType,
  additionalContext?: string
): Promise<AnalysisResult> {
  const systemPrompt = analysisPrompts[type];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Analyze this website content:\n\n${content}${
            additionalContext ? `\n\nAdditional context: ${additionalContext}` : ""
          }`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4000,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      return {
        success: false,
        type,
        content: {},
        error: "No response from OpenAI",
      };
    }

    const parsedContent = JSON.parse(responseContent);
    return {
      success: true,
      type,
      content: parsedContent,
    };
  } catch (error) {
    console.error("OpenAI analysis error:", error);
    return {
      success: false,
      type,
      content: {},
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function generateMockupPrompt(
  project: {
    name: string;
    url: string;
    clientProblems?: string | null;
    competitorAnalysis?: string | null;
    projectRequirements?: string | null;
    clientNotes?: string | null;
  },
  analyses: { type: string; content: Record<string, unknown> | null }[],
  competitors: { name: string; url: string; type?: string; preferredFeature?: string | null; notes?: string | null; screenshotLabel?: string | null; screenshot?: string | null; referenceImages?: { url: string; tag: "emulate" | "avoid" | null }[] | null }[],
  options: { style: string; pageType: string; aspectRatio?: string; customInstructions?: string; designTokensContext?: string; productContext?: string; hasLogo?: boolean; selectedProductImageCount?: number }
): Promise<{ prompt: string }> {
  const systemPrompt = `You are an elite prompt engineer specializing in crafting image-generation prompts for AI models like Google Gemini Imagen. Your job is to take project context and produce a single, hyper-detailed image prompt that will generate a stunning, realistic website mockup screenshot.

RULES FOR THE PROMPT YOU WRITE:
1. USE CONCRETE VISUAL LANGUAGE ONLY — never say "professional feel" or "modern look". Instead say "navy blue navigation bar with white 14px sans-serif text, left-aligned logo, right-aligned menu links spaced 32px apart".
2. SPECIFY EXACT LAYOUT — describe sections top-to-bottom: navigation, hero, features grid, testimonials, CTA banner, footer. State grid structures (e.g. "3-column card grid with 24px gaps").
3. INCLUDE COLOR PALETTE — use hex codes. E.g. "primary: #1a1a2e, accent: #e94560, background: #f5f5f5, text: #333333".
4. DESCRIBE TYPOGRAPHY — mention weight (bold, semibold, regular), style (sans-serif, serif), and relative sizes (e.g. "hero headline 48px bold sans-serif, subheadline 20px regular").
5. NAME SPECIFIC UI COMPONENTS — hero section, sticky navbar, product cards, testimonial carousel, CTA buttons with rounded corners, icon grid, trust badges, newsletter signup, multi-column footer with social icons.
6. SPECIFY FRAMING — "Desktop browser screenshot at 1440px width, shown in a clean browser chrome frame" or "Full-page website screenshot without browser chrome".
7. INCLUDE NEGATIVE GUIDANCE — "Not a wireframe. Not a low-fidelity sketch. No lorem ipsum placeholder text — use realistic English copy. No watermarks. No UI kit component sheets."
8. ANCHOR QUALITY — "Awwwards-quality design. Behance featured project level. Pixel-perfect rendering."
9. INCLUDE REALISTIC CONTENT — suggest actual headline text, button labels, and section copy that match the brand.
10. USE ALL PROVIDED CONTEXT — you MUST incorporate the client's problems, competitor analysis, project requirements, client notes, and AI analysis insights into the visual design. For example, if the client wants better CTAs, describe specific CTA button designs. If analysis mentions poor navigation, describe an improved nav. If competitors are labeled as POSITIVE INSPIRATION, emulate their design patterns. If competitors are labeled as NEGATIVE EXAMPLES, explicitly avoid their design patterns. The prompt must reflect the SPECIFIC business, not a generic website.
11. USE PROVIDED DESIGN TOKENS — if design tokens are provided, use the exact hex codes, font names, and spacing values from those tokens. Do not invent new colors or fonts when tokens are available.
12. USE REAL PRODUCT DATA — if product data is provided, use exact product names, prices, descriptions, and variant info. Show real product cards with real names and prices, not placeholder text.
13. REFERENCE ATTACHED SCREENSHOTS — if competitors have attached reference screenshots, your prompt MUST explicitly reference them using their individual tags. Screenshots tagged "emulate" mean: copy and draw from their design patterns, layout, colors, and visual style. Screenshots tagged "avoid" mean: do NOT replicate those layouts, styles, or patterns — design away from them. For each competitor with attached images, write specific instructions like "Draw from the attached 'emulate' reference from [Competitor Name] for layout and color cues" or "The attached 'avoid' reference from [Competitor Name] shows patterns to steer away from". Be specific about what visual elements to use or reject. The image-generation model will receive these screenshots alongside your prompt.

Return a JSON object with a single key "prompt" containing the complete image-generation prompt as a string. The prompt should be 400-800 words.`;

  // Assemble all project context
  const contextParts: string[] = [];
  contextParts.push(`Website: "${project.name}" (${project.url})`);
  contextParts.push(`Design Style: ${options.style}`);
  contextParts.push(`Page Type: ${options.pageType}`);

  if (project.clientProblems) {
    contextParts.push(`Client Problems:\n${project.clientProblems.slice(0, 2000)}`);
  }
  if (project.competitorAnalysis) {
    contextParts.push(`Competitor Analysis & Desired Features:\n${project.competitorAnalysis.slice(0, 2000)}`);
  }
  if (project.projectRequirements) {
    contextParts.push(`Project Requirements:\n${project.projectRequirements.slice(0, 2000)}`);
  }
  if (project.clientNotes) {
    contextParts.push(`Client Notes:\n${project.clientNotes.slice(0, 1000)}`);
  }

  // Extract rich detail from each analysis type
  for (const analysis of analyses) {
    let content = analysis.content;
    if (!content) continue;
    // Handle case where content is stored as string
    if (typeof content === "string") {
      try { content = JSON.parse(content); } catch { continue; }
    }
    const c = content as Record<string, unknown>;

    const parts: string[] = [];
    // Always include summary
    const summary = (c.summary as string) || (c.overview as string);
    if (summary) parts.push(summary);

    // Extract key details per analysis type
    if (analysis.type === "marketing") {
      const vp = c.valueProposition as Record<string, unknown> | undefined;
      if (vp?.identified) parts.push(`Value proposition: ${vp.identified}`);
      const msg = c.messaging as Record<string, unknown> | undefined;
      if (msg?.tone) parts.push(`Tone: ${msg.tone}`);
      if (msg?.targetAudience) parts.push(`Target audience: ${msg.targetAudience}`);
      const ctas = c.ctas as Record<string, unknown> | undefined;
      if (ctas?.found && Array.isArray(ctas.found)) parts.push(`CTAs: ${(ctas.found as string[]).join(", ")}`);
    } else if (analysis.type === "architecture") {
      const nav = c.navigation as Record<string, unknown> | undefined;
      if (nav?.items && Array.isArray(nav.items)) parts.push(`Nav items: ${(nav.items as string[]).join(", ")}`);
      const structure = c.siteStructure as Record<string, unknown> | undefined;
      if (structure?.mainSections && Array.isArray(structure.mainSections)) parts.push(`Main sections: ${(structure.mainSections as string[]).join(", ")}`);
    } else if (analysis.type === "recommendations") {
      const qw = c.quickWins as Record<string, unknown> | undefined;
      if (qw?.items && Array.isArray(qw.items)) {
        const titles = (qw.items as { title: string }[]).map(i => i.title).slice(0, 5);
        parts.push(`Quick wins: ${titles.join(", ")}`);
      }
    }

    if (parts.length > 0) {
      contextParts.push(`${analysis.type} analysis:\n${parts.join("\n").slice(0, 600)}`);
    }
  }

  // Add competitor context grouped by label
  const goodComps = competitors.filter((c) => c.screenshotLabel === "good");
  const badComps = competitors.filter((c) => c.screenshotLabel === "bad");
  const unlabeledComps = competitors.filter((c) => !c.screenshotLabel);

  const formatCompDetail = (c: typeof competitors[0]) => {
    const detail = [`${c.name} (${c.url})`];
    if (c.preferredFeature) detail.push(`preferred feature: ${c.preferredFeature}`);
    if (c.notes) detail.push(`notes: ${c.notes!.slice(0, 150)}`);
    // Summarize per-image tags
    const refs = c.referenceImages || [];
    const emulateCount = refs.filter(r => r.tag === "emulate").length + (c.screenshot && c.screenshotLabel !== "bad" ? 1 : 0);
    const avoidCount = refs.filter(r => r.tag === "avoid").length + (c.screenshot && c.screenshotLabel === "bad" ? 1 : 0);
    const untaggedCount = refs.filter(r => !r.tag).length;
    const parts: string[] = [];
    if (emulateCount > 0) parts.push(`${emulateCount} "emulate" screenshot(s)`);
    if (avoidCount > 0) parts.push(`${avoidCount} "avoid" screenshot(s)`);
    if (untaggedCount > 0) parts.push(`${untaggedCount} untagged screenshot(s)`);
    if (parts.length > 0) detail.push(`attached: ${parts.join(", ")}`);
    return detail.join(" — ");
  };

  if (goodComps.length > 0) {
    contextParts.push(`POSITIVE INSPIRATION (reference screenshots will be attached to the image model — respect each image's individual "emulate" or "avoid" tag):\n${goodComps.slice(0, 5).map(formatCompDetail).join("\n")}`);
  }
  if (badComps.length > 0) {
    contextParts.push(`NEGATIVE EXAMPLES (reference screenshots will be attached to the image model — respect each image's individual "emulate" or "avoid" tag):\n${badComps.slice(0, 5).map(formatCompDetail).join("\n")}`);
  }
  if (unlabeledComps.length > 0) {
    contextParts.push(`Competitor/inspiration sites (reference screenshots will be attached to the image model — respect each image's individual "emulate" or "avoid" tag):\n${unlabeledComps.slice(0, 5).map(formatCompDetail).join("\n")}`);
  }

  if (options.designTokensContext) {
    contextParts.push(`Design Tokens (use these exact values):\n${options.designTokensContext}`);
  }

  if (options.productContext) {
    contextParts.push(options.productContext);
  }

  if (options.customInstructions) {
    contextParts.push(`Custom Instructions: ${options.customInstructions}`);
  }

  const userPrompt = `Based on the following project context, craft the perfect image-generation prompt for a ${options.pageType} mockup in the "${options.style}" style.\n\n${contextParts.join("\n\n")}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 2000,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error("No response from OpenAI");
    }

    const parsed = JSON.parse(responseContent);
    return { prompt: parsed.prompt || responseContent };
  } catch (error) {
    console.error("OpenAI mockup prompt generation error:", error);
    throw error;
  }
}

export async function generateRecommendedSitemap(
  currentSitemap: Record<string, unknown>,
  pageContent: string,
  context: {
    clientName: string | null;
    clientProblems: string | null;
    competitorAnalysis: string | null;
    projectUrl: string;
  }
): Promise<Record<string, unknown>> {
  const systemPrompt = `You are a Shopify information architecture (IA) expert and SEO strategist. You will receive a current website sitemap structure and page content. Your job is to recommend an improved sitemap that:

1. Follows Shopify best practices for collections, products, pages, and blog structure
2. Optimizes for SEO with clean URL hierarchy
3. Improves conversion paths and user navigation
4. Consolidates or removes redundant pages
5. Suggests new pages that are missing but important

Return a JSON object with this exact structure:
{
  "rootNode": {
    "id": string (uuid),
    "label": string,
    "path": "/",
    "url": string,
    "pageType": "homepage" | "collection" | "product" | "page" | "blog" | "article" | "other",
    "hasContent": boolean,
    "children": [recursive same structure],
    "metadata": {
      "title": string,
      "isNew": boolean (true if this is a new page suggestion),
      "isRemoved": boolean (true if recommending removal),
      "isMoved": boolean (true if recommending relocation),
      "movedFrom": string | null (original path if moved),
      "priority": "high" | "medium" | "low",
      "notes": string (brief explanation of why this change)
    }
  },
  "totalPages": number,
  "maxDepth": number,
  "generatedAt": string (ISO date),
  "projectUrl": string,
  "aiRationale": string (2-3 paragraph explanation of overall IA strategy),
  "keyChanges": string[] (list of 5-8 key changes/improvements made)
}

Important rules:
- Keep existing pages that work well (don't annotate them as new/removed/moved)
- Use Shopify-standard paths: /collections/*, /products/*, /pages/*, /blogs/*
- Every node must have a unique "id" field (use uuid format)
- Set appropriate "pageType" for each node
- Include "notes" for any node with isNew, isRemoved, or isMoved set to true`;

  let userPrompt = `Current website: ${context.projectUrl}\n\n`;
  if (context.clientName) userPrompt += `Client: ${context.clientName}\n`;
  if (context.clientProblems) userPrompt += `Client Problems: ${context.clientProblems}\n`;
  if (context.competitorAnalysis) userPrompt += `Competitor Analysis & Desired Features: ${context.competitorAnalysis}\n`;
  userPrompt += `\nCurrent Sitemap Structure:\n${JSON.stringify(currentSitemap, null, 2)}\n\n`;
  userPrompt += `Page Content:\n${pageContent}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4000,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error("No response from OpenAI");
    }

    return JSON.parse(responseContent);
  } catch (error) {
    console.error("OpenAI sitemap generation error:", error);
    throw error;
  }
}

export async function analyzeAll(
  content: string,
  additionalContext?: string
): Promise<AnalysisResult[]> {
  const types: AnalysisType[] = [
    "marketing",
    "techstack",
    "architecture",
    "performance",
    "recommendations",
  ];

  const results = await Promise.all(
    types.map((type) => analyzeContent(content, type, additionalContext))
  );

  return results;
}
