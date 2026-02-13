export type { PlatformInfo, ShopifyTemplate } from "@/lib/platform-detector";
import type { PlatformInfo } from "@/lib/platform-detector";

export type ProjectStatus =
  | "pending"
  | "scraping"
  | "scraped"
  | "analyzing"
  | "complete"
  | "error";

export type AnalysisType =
  | "marketing"
  | "techstack"
  | "architecture"
  | "performance"
  | "recommendations";

export interface Project {
  id: string;
  name: string;
  url: string;
  clientName: string | null;
  clientProblems: string | null;
  competitorAnalysis: string | null;
  projectRequirements: string | null;
  clientNotes: string | null;
  crawlJobId: string | null;
  logo: string | null;
  platformInfo: PlatformInfo | null;
  status: ProjectStatus;
  contextUpdatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Page {
  id: string;
  projectId: string;
  url: string;
  title: string | null;
  content: string | null;
  screenshot: string | null;
  fullPageScreenshot: string | null;
  metadata: Record<string, unknown> | null;
  version: number;
  archived: number;
  createdAt: Date;
}

export interface PageVersion {
  id: string;
  pageId: string;
  version: number;
  url: string;
  title: string | null;
  content: string | null;
  screenshot: string | null;
  fullPageScreenshot: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface Analysis {
  id: string;
  projectId: string;
  type: AnalysisType;
  content: Record<string, unknown> | null;
  createdAt: Date;
}

export interface MarketingAnalysis {
  seo: {
    score: number;
    findings: string[];
    improvements: string[];
  };
  ctas: {
    found: string[];
    effectiveness: string;
    suggestions: string[];
  };
  valueProposition: {
    identified: string;
    clarity: string;
    improvements: string[];
  };
  messaging: {
    tone: string;
    consistency: string;
    targetAudience: string;
    suggestions: string[];
  };
  conversionOptimization: {
    currentScore: number;
    opportunities: string[];
  };
  summary: string;
}

export interface TechStackAnalysis {
  frameworks: {
    frontend: string[];
    backend: string[];
    evidence: string[];
  };
  cms: {
    identified: string | null;
    confidence: string;
  };
  analytics: string[];
  thirdPartyTools: {
    name: string;
    purpose: string;
  }[];
  hosting: {
    indicators: string[];
    likelyProvider: string;
  };
  buildTools: string[];
  performance: {
    optimizations: string[];
    concerns: string[];
  };
  summary: string;
}

export interface ArchitectureAnalysis {
  siteStructure: {
    mainSections: string[];
    hierarchy: string;
    depth: number;
  };
  navigation: {
    type: string;
    items: string[];
    usability: string;
  };
  pageHierarchy: {
    topLevel: string[];
    subPages: { parent: string; children: string[] }[];
  };
  urlStructure: {
    pattern: string;
    seoFriendly: boolean;
    suggestions: string[];
  };
  contentOrganization: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
  summary: string;
}

export interface PerformanceAnalysis {
  pageSpeed: {
    indicators: string[];
    concerns: string[];
  };
  mobileResponsiveness: {
    indicators: string[];
    score: number;
  };
  assetOptimization: {
    images: string;
    scripts: string;
    styles: string;
  };
  coreWebVitals: {
    predictions: string[];
  };
  recommendations: {
    immediate: string[];
    longTerm: string[];
  };
  summary: string;
}

export interface RecommendationsAnalysis {
  quickWins: {
    items: { title: string; description: string; impact: string; effort: string }[];
    timeframe: string;
  };
  strategicChanges: {
    items: { title: string; description: string; impact: string; effort: string }[];
    timeframe: string;
  };
  technicalDebt: {
    items: { issue: string; priority: string; recommendation: string }[];
  };
  priorityMatrix: {
    highImpactLowEffort: string[];
    highImpactHighEffort: string[];
    lowImpactLowEffort: string[];
    lowImpactHighEffort: string[];
  };
  roadmap: {
    phase1: string[];
    phase2: string[];
    phase3: string[];
  };
  summary: string;
}

export type CompetitorType = "competitor" | "inspiration";
export type ScreenshotLabel = "good" | "bad";
export type ReferenceImageTag = "emulate" | "avoid";

export interface ReferenceImage {
  url: string;
  tag: ReferenceImageTag | null;
}

/** Normalize legacy string[] or new ReferenceImage[] from DB JSON */
export function normalizeReferenceImages(raw: unknown): ReferenceImage[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.map((item) => {
    if (typeof item === "string") return { url: item, tag: null };
    return item as ReferenceImage;
  });
}

export interface Competitor {
  id: string;
  projectId: string;
  name: string;
  url: string;
  type: CompetitorType;
  preferredFeature: string | null;
  preferredFeatureUrl: string | null;
  screenshot: string | null;
  referenceImages: ReferenceImage[] | null;
  screenshotLabel: ScreenshotLabel | null;
  notes: string | null;
  createdAt: Date;
}

export interface SitemapNode {
  id: string;
  label: string;
  path: string;
  url?: string;
  pageType?: "homepage" | "collection" | "product" | "page" | "blog" | "article" | "other";
  hasContent?: boolean;
  children: SitemapNode[];
  metadata?: {
    title?: string;
    pageId?: string;
    shopifyResourceType?: string;
    visualMockupId?: string;
    isNew?: boolean;
    isRemoved?: boolean;
    isMoved?: boolean;
    movedFrom?: string;
    priority?: "high" | "medium" | "low";
    notes?: string;
  };
}

export interface SitemapData {
  rootNode: SitemapNode;
  totalPages: number;
  maxDepth: number;
  generatedAt: string;
  projectUrl: string;
  aiRationale?: string;
  keyChanges?: string[];
}

export interface SitemapType {
  id: string;
  projectId: string;
  type: "current" | "recommended";
  data: SitemapData;
  createdAt: Date;
}

export interface Mockup {
  id: string;
  projectId: string;
  prompt: string;
  image: string;
  label: string | null;
  style: string | null;
  originalPrompt: string | null;
  customInstructions: string | null;
  styleRef: string | null;
  createdAt: Date;
}

export interface SavedPrompt {
  id: string;
  projectId: string;
  name: string;
  prompt: string;
  style: string | null;
  pageType: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductVariant {
  name: string;
  options: string[];
}

export interface Product {
  id: string;
  projectId: string;
  pageId: string;
  name: string;
  description: string | null;
  price: string | null;
  currency: string | null;
  variants: ProductVariant[] | null;
  specifications: Record<string, string> | null;
  images: string[] | null;
  category: string | null;
  brand: string | null;
  sku: string | null;
  availability: string | null;
  rawExtraction: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}
