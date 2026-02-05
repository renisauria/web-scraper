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
