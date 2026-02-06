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
