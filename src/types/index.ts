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
  crawlJobId: string | null;
  status: ProjectStatus;
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
