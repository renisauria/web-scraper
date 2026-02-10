import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

// ─── Analysis ───────────────────────────────────────────────────────

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
}

Return ONLY valid JSON, no markdown fences, no explanation.`,

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
}

Return ONLY valid JSON, no markdown fences, no explanation.`,

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
    "subPages": { "parent": string, "children": string[] }[]
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
}

Return ONLY valid JSON, no markdown fences, no explanation.`,

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
}

Return ONLY valid JSON, no markdown fences, no explanation.`,

  recommendations: `You are a digital strategy consultant. Based on the provided website content, provide prioritized improvement recommendations in JSON format:
{
  "quickWins": {
    "items": { "title": string, "description": string, "impact": string, "effort": string }[],
    "timeframe": string
  },
  "strategicChanges": {
    "items": { "title": string, "description": string, "impact": string, "effort": string }[],
    "timeframe": string
  },
  "technicalDebt": {
    "items": { "issue": string, "priority": string, "recommendation": string }[]
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
}

Return ONLY valid JSON, no markdown fences, no explanation.`,
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
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Analyze this website content:\n\n${content}${
            additionalContext ? `\n\nAdditional context: ${additionalContext}` : ""
          }`,
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return {
        success: false,
        type,
        content: {},
        error: "No response from Claude",
      };
    }

    // Strip any markdown code fences if present
    let jsonText = textBlock.text.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const parsedContent = JSON.parse(jsonText);
    return {
      success: true,
      type,
      content: parsedContent,
    };
  } catch (error) {
    console.error("Claude analysis error:", error);
    return {
      success: false,
      type,
      content: {},
      error: error instanceof Error ? error.message : "Unknown error",
    };
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

// ─── Recommended Sitemap ────────────────────────────────────────────

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
- Include "notes" for any node with isNew, isRemoved, or isMoved set to true

Return ONLY valid JSON, no markdown fences, no explanation.`;

  let userPrompt = `Current website: ${context.projectUrl}\n\n`;
  if (context.clientName) userPrompt += `Client: ${context.clientName}\n`;
  if (context.clientProblems) userPrompt += `Client Problems: ${context.clientProblems}\n`;
  if (context.competitorAnalysis) userPrompt += `Competitor Analysis & Desired Features: ${context.competitorAnalysis}\n`;
  userPrompt += `\nCurrent Sitemap Structure:\n${JSON.stringify(currentSitemap, null, 2)}\n\n`;
  userPrompt += `Page Content:\n${pageContent}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No response from Claude");
    }

    let jsonText = textBlock.text.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Claude sitemap generation error:", error);
    throw error;
  }
}

// ─── Product Extraction ─────────────────────────────────────────────

export interface ExtractedProduct {
  name: string;
  description: string | null;
  price: string | null;
  currency: string;
  variants: { name: string; options: string[] }[];
  specifications: Record<string, string>;
  images: string[];
  category: string | null;
  brand: string | null;
  sku: string | null;
  availability: string | null;
}

export interface ExtractionResult {
  success: boolean;
  products: ExtractedProduct[];
  pageType: "single_product" | "collection" | "no_products";
  error?: string;
}

export async function extractProductsFromContent(
  markdownContent: string,
  pageUrl: string
): Promise<ExtractionResult> {
  const truncated = markdownContent.slice(0, 12000);

  const systemPrompt = `You are a product data extraction specialist. Given website page content in markdown format, extract structured product information.

First, detect the page type:
- "single_product": A dedicated product detail page with one main product
- "collection": A listing/category page with multiple products
- "no_products": Not a product page (e.g., About, Contact, Blog)

For each product found, extract:
- name: Product name (required)
- description: Product description text
- price: Price as displayed (e.g., "$29.99", "$10 - $20", "from $99")
- currency: ISO currency code (e.g., "USD", "EUR", "GBP")
- variants: Array of variant groups, each with {name, options[]} (e.g., {name: "Size", options: ["S","M","L"]})
- specifications: Key-value object of product specs (e.g., {"Material": "Cotton", "Weight": "200g"})
- images: Array of image URLs found in the content (resolve relative URLs against the page URL)
- category: Product category if detectable
- brand: Brand name if mentioned
- sku: SKU/product ID if shown
- availability: Stock status (e.g., "In Stock", "Out of Stock", "Pre-order")

Rules:
- Extract up to 20 products maximum (for collection pages)
- If price has a currency symbol, set currency accordingly ($ = USD, € = EUR, £ = GBP)
- Convert relative image URLs to absolute using the provided page URL
- If no products are found, return pageType "no_products" with empty products array

Return ONLY a JSON object with this structure, no markdown fences, no explanation:
{
  "pageType": "single_product" | "collection" | "no_products",
  "products": [...]
}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4000,
      temperature: 0.3,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Page URL: ${pageUrl}\n\nPage content:\n${truncated}`,
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return {
        success: false,
        products: [],
        pageType: "no_products",
        error: "No response from Claude",
      };
    }

    let jsonText = textBlock.text.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const parsed = JSON.parse(jsonText);
    const products: ExtractedProduct[] = (parsed.products || []).map(
      (p: Record<string, unknown>) => ({
        name: String(p.name || "Unnamed Product"),
        description: p.description ? String(p.description) : null,
        price: p.price ? String(p.price) : null,
        currency: String(p.currency || "USD"),
        variants: Array.isArray(p.variants) ? p.variants : [],
        specifications:
          p.specifications && typeof p.specifications === "object"
            ? (p.specifications as Record<string, string>)
            : {},
        images: Array.isArray(p.images) ? p.images.map(String) : [],
        category: p.category ? String(p.category) : null,
        brand: p.brand ? String(p.brand) : null,
        sku: p.sku ? String(p.sku) : null,
        availability: p.availability ? String(p.availability) : null,
      })
    );

    return {
      success: true,
      products,
      pageType: parsed.pageType || "no_products",
    };
  } catch (error) {
    console.error("Product extraction error:", error);
    return {
      success: false,
      products: [],
      pageType: "no_products",
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
  options: { style: string; pageType: string; customInstructions?: string; designTokensContext?: string; productContext?: string }
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
10. USE PROVIDED DESIGN TOKENS — if design tokens are provided, use the exact hex codes, font names, and spacing values from those tokens. Do not invent new colors or fonts when tokens are available.
11. USE REAL PRODUCT DATA — if product data is provided, use exact product names, prices, descriptions, and variant info. Show real product cards with real names and prices, not placeholder text.
12. USE COMPETITOR GUIDANCE — if competitors are labeled as POSITIVE INSPIRATION, emulate their design patterns and visual strengths. If competitors are labeled as NEGATIVE EXAMPLES, explicitly avoid their design patterns and shortcomings.
13. REFERENCE ATTACHED SCREENSHOTS — if competitors have attached reference screenshots, your prompt MUST explicitly reference them using their individual tags. Screenshots tagged "emulate" mean: copy and draw from their design patterns, layout, colors, and visual style. Screenshots tagged "avoid" mean: do NOT replicate those layouts, styles, or patterns — design away from them. For each competitor with attached images, write specific instructions like "Draw from the attached 'emulate' reference from [Competitor Name] for layout and color cues" or "The attached 'avoid' reference from [Competitor Name] shows patterns to steer away from". Be specific about what visual elements to use or reject. The image-generation model will receive these screenshots alongside your prompt.

Return ONLY the complete image-generation prompt as plain text (no JSON wrapper, no markdown, no explanation). The prompt should be 400-800 words.`;

  // Assemble all project context
  const contextParts: string[] = [];
  contextParts.push(`Website: "${project.name}" (${project.url})`);
  contextParts.push(`Design Style: ${options.style}`);
  contextParts.push(`Page Type: ${options.pageType}`);

  if (project.clientProblems) {
    contextParts.push(
      `Client Problems:\n${project.clientProblems.slice(0, 2000)}`
    );
  }
  if (project.competitorAnalysis) {
    contextParts.push(
      `Competitor Analysis & Desired Features:\n${project.competitorAnalysis.slice(0, 2000)}`
    );
  }
  if (project.projectRequirements) {
    contextParts.push(
      `Project Requirements:\n${project.projectRequirements.slice(0, 2000)}`
    );
  }
  if (project.clientNotes) {
    contextParts.push(
      `Client Notes:\n${project.clientNotes.slice(0, 1000)}`
    );
  }

  // Add analysis summaries
  for (const analysis of analyses) {
    const content = analysis.content;
    if (!content) continue;
    const summary =
      (content.summary as string) || (content.overview as string);
    if (summary) {
      contextParts.push(
        `${analysis.type} analysis insight: ${summary.slice(0, 300)}`
      );
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
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2000,
      temperature: 0.8,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }

    return { prompt: textBlock.text };
  } catch (error: unknown) {
    console.error("Claude mockup prompt generation error:", error);
    if (error && typeof error === "object" && "status" in error && (error as { status: number }).status === 400) {
      const msg = (error as { message?: string }).message || "";
      if (msg.includes("credit balance")) {
        throw new Error("Anthropic API credit balance is too low. Please add credits at console.anthropic.com.");
      }
    }
    throw error;
  }
}
