"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  SpinnerGap,
  WarningCircle,
  ChartBar,
  CodeBlock,
  Layout,
  Lightning,
  Lightbulb,
  FileText,
  CheckCircle,
  XCircle,
} from "@phosphor-icons/react";
import type { Project, Analysis } from "@/types";

interface ProjectData {
  project: Project;
  analyses: Analysis[];
}

export default function AnalysisPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "marketing"
  );

  const fetchProject = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          router.push("/projects");
          return;
        }
        throw new Error("Failed to fetch project");
      }
      const projectData = await response.json();
      setData(projectData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <SpinnerGap className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data || data.analyses.length === 0) {
    return (
      <Alert variant="destructive">
        <WarningCircle className="h-4 w-4" />
        <AlertDescription>
          No analysis data found. Please run the analysis first.
        </AlertDescription>
      </Alert>
    );
  }

  const { project, analyses } = data;
  const analysisMap = new Map(analyses.map((a) => [a.type, a.content]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/projects/${id}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Project
          </Link>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Analysis Results</h1>
            <p className="text-muted-foreground">{project.name}</p>
          </div>
        </div>
        <Link href={`/projects/${id}/report`}>
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </Link>
      </div>

      {error && (
        <Alert variant="destructive">
          <WarningCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="marketing" className="flex items-center gap-2">
            <ChartBar className="h-4 w-4" />
            <span className="hidden sm:inline">Marketing</span>
          </TabsTrigger>
          <TabsTrigger value="techstack" className="flex items-center gap-2">
            <CodeBlock className="h-4 w-4" />
            <span className="hidden sm:inline">Tech Stack</span>
          </TabsTrigger>
          <TabsTrigger value="architecture" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            <span className="hidden sm:inline">Architecture</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Lightning className="h-4 w-4" />
            <span className="hidden sm:inline">Performance</span>
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            <span className="hidden sm:inline">Recommendations</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="marketing" className="space-y-4 mt-6">
          <MarketingAnalysis data={analysisMap.get("marketing")} />
        </TabsContent>

        <TabsContent value="techstack" className="space-y-4 mt-6">
          <TechStackAnalysis data={analysisMap.get("techstack")} />
        </TabsContent>

        <TabsContent value="architecture" className="space-y-4 mt-6">
          <ArchitectureAnalysis data={analysisMap.get("architecture")} />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4 mt-6">
          <PerformanceAnalysis data={analysisMap.get("performance")} />
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4 mt-6">
          <RecommendationsAnalysis data={analysisMap.get("recommendations")} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MarketingAnalysis({ data }: { data: Record<string, unknown> | undefined | null }) {
  if (!data) return <NoDataCard />;

  const d = data as {
    seo?: { score?: number; findings?: string[]; improvements?: string[] };
    ctas?: { found?: string[]; effectiveness?: string; suggestions?: string[] };
    valueProposition?: { identified?: string; clarity?: string; improvements?: string[] };
    messaging?: { tone?: string; consistency?: string; targetAudience?: string; suggestions?: string[] };
    conversionOptimization?: { currentScore?: number; opportunities?: string[] };
    summary?: string;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            SEO Analysis
            <ScoreIndicator score={d.seo?.score || 0} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {d.seo?.findings && d.seo.findings.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Findings</h4>
              <ul className="space-y-1">
                {d.seo.findings.map((f, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {d.seo?.improvements && d.seo.improvements.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Improvements</h4>
              <ul className="space-y-1">
                {d.seo.improvements.map((i, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Call-to-Actions</CardTitle>
          <CardDescription>{d.ctas?.effectiveness}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {d.ctas?.found && d.ctas.found.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Found CTAs</h4>
              <div className="flex flex-wrap gap-2">
                {d.ctas.found.map((c, i) => (
                  <Badge key={i} variant="secondary">{c}</Badge>
                ))}
              </div>
            </div>
          )}
          {d.ctas?.suggestions && d.ctas.suggestions.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Suggestions</h4>
              <ul className="space-y-1">
                {d.ctas.suggestions.map((s, i) => (
                  <li key={i} className="text-sm text-muted-foreground">• {s}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Value Proposition</CardTitle>
          <CardDescription>Clarity: {d.valueProposition?.clarity}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">{d.valueProposition?.identified}</p>
          {d.valueProposition?.improvements && d.valueProposition.improvements.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Improvements</h4>
              <ul className="space-y-1">
                {d.valueProposition.improvements.map((i, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground">• {i}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Conversion Optimization
            <ScoreIndicator score={d.conversionOptimization?.currentScore || 0} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {d.conversionOptimization?.opportunities && d.conversionOptimization.opportunities.length > 0 && (
            <ul className="space-y-1">
              {d.conversionOptimization.opportunities.map((o, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                  {o}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {d.summary && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{d.summary}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TechStackAnalysis({ data }: { data: Record<string, unknown> | undefined | null }) {
  if (!data) return <NoDataCard />;

  const d = data as {
    frameworks?: { frontend?: string[]; backend?: string[]; evidence?: string[] };
    cms?: { identified?: string | null; confidence?: string };
    analytics?: string[];
    thirdPartyTools?: { name: string; purpose: string }[];
    hosting?: { indicators?: string[]; likelyProvider?: string };
    buildTools?: string[];
    performance?: { optimizations?: string[]; concerns?: string[] };
    summary?: string;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Frameworks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Frontend</h4>
            <div className="flex flex-wrap gap-2">
              {d.frameworks?.frontend?.map((f, i) => (
                <Badge key={i} variant="default">{f}</Badge>
              )) || <span className="text-sm text-muted-foreground">None detected</span>}
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Backend</h4>
            <div className="flex flex-wrap gap-2">
              {d.frameworks?.backend?.map((b, i) => (
                <Badge key={i} variant="secondary">{b}</Badge>
              )) || <span className="text-sm text-muted-foreground">None detected</span>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>CMS & Hosting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">CMS</h4>
            <p className="text-sm">
              {d.cms?.identified || "None detected"}
              {d.cms?.confidence && <span className="text-muted-foreground"> ({d.cms.confidence})</span>}
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Hosting Provider</h4>
            <p className="text-sm">{d.hosting?.likelyProvider || "Unknown"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Analytics & Tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {d.analytics && d.analytics.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Analytics</h4>
              <div className="flex flex-wrap gap-2">
                {d.analytics.map((a, i) => (
                  <Badge key={i} variant="outline">{a}</Badge>
                ))}
              </div>
            </div>
          )}
          {d.thirdPartyTools && d.thirdPartyTools.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Third-party Tools</h4>
              <ul className="space-y-1">
                {d.thirdPartyTools.map((t, i) => (
                  <li key={i} className="text-sm">
                    <span className="font-medium">{t.name}</span>
                    <span className="text-muted-foreground"> - {t.purpose}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Build Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {d.buildTools?.map((b, i) => (
              <Badge key={i} variant="secondary">{b}</Badge>
            )) || <span className="text-sm text-muted-foreground">None detected</span>}
          </div>
        </CardContent>
      </Card>

      {d.summary && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{d.summary}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ArchitectureAnalysis({ data }: { data: Record<string, unknown> | undefined | null }) {
  if (!data) return <NoDataCard />;

  const d = data as {
    siteStructure?: { mainSections?: string[]; hierarchy?: string; depth?: number };
    navigation?: { type?: string; items?: string[]; usability?: string };
    pageHierarchy?: { topLevel?: string[]; subPages?: { parent: string; children: string[] }[] };
    urlStructure?: { pattern?: string; seoFriendly?: boolean; suggestions?: string[] };
    contentOrganization?: { strengths?: string[]; weaknesses?: string[]; recommendations?: string[] };
    summary?: string;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Site Structure</CardTitle>
          <CardDescription>{d.siteStructure?.hierarchy}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Main Sections</h4>
            <div className="flex flex-wrap gap-2">
              {d.siteStructure?.mainSections?.map((s, i) => (
                <Badge key={i} variant="secondary">{s}</Badge>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Site Depth</h4>
            <p className="text-sm">{d.siteStructure?.depth} levels</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Navigation</CardTitle>
          <CardDescription>Type: {d.navigation?.type}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {d.navigation?.items && d.navigation.items.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Navigation Items</h4>
              <div className="flex flex-wrap gap-2">
                {d.navigation.items.map((n, i) => (
                  <Badge key={i} variant="outline">{n}</Badge>
                ))}
              </div>
            </div>
          )}
          <div>
            <h4 className="font-medium mb-2">Usability</h4>
            <p className="text-sm text-muted-foreground">{d.navigation?.usability}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            URL Structure
            {d.urlStructure?.seoFriendly ? (
              <Badge variant="default">SEO Friendly</Badge>
            ) : (
              <Badge variant="destructive">Needs Work</Badge>
            )}
          </CardTitle>
          <CardDescription>{d.urlStructure?.pattern}</CardDescription>
        </CardHeader>
        <CardContent>
          {d.urlStructure?.suggestions && d.urlStructure.suggestions.length > 0 && (
            <ul className="space-y-1">
              {d.urlStructure.suggestions.map((s, i) => (
                <li key={i} className="text-sm text-muted-foreground">• {s}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Content Organization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {d.contentOrganization?.strengths && d.contentOrganization.strengths.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" /> Strengths
              </h4>
              <ul className="space-y-1">
                {d.contentOrganization.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-muted-foreground">• {s}</li>
                ))}
              </ul>
            </div>
          )}
          {d.contentOrganization?.weaknesses && d.contentOrganization.weaknesses.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" /> Weaknesses
              </h4>
              <ul className="space-y-1">
                {d.contentOrganization.weaknesses.map((w, i) => (
                  <li key={i} className="text-sm text-muted-foreground">• {w}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {d.summary && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{d.summary}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PerformanceAnalysis({ data }: { data: Record<string, unknown> | undefined | null }) {
  if (!data) return <NoDataCard />;

  const d = data as {
    pageSpeed?: { indicators?: string[]; concerns?: string[] };
    mobileResponsiveness?: { indicators?: string[]; score?: number };
    assetOptimization?: { images?: string; scripts?: string; styles?: string };
    coreWebVitals?: { predictions?: string[] };
    recommendations?: { immediate?: string[]; longTerm?: string[] };
    summary?: string;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Page Speed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {d.pageSpeed?.indicators && d.pageSpeed.indicators.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Positive Indicators</h4>
              <ul className="space-y-1">
                {d.pageSpeed.indicators.map((i, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {d.pageSpeed?.concerns && d.pageSpeed.concerns.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Concerns</h4>
              <ul className="space-y-1">
                {d.pageSpeed.concerns.map((c, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <WarningCircle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Mobile Responsiveness
            <ScoreIndicator score={d.mobileResponsiveness?.score || 0} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {d.mobileResponsiveness?.indicators && d.mobileResponsiveness.indicators.length > 0 && (
            <ul className="space-y-1">
              {d.mobileResponsiveness.indicators.map((i, idx) => (
                <li key={idx} className="text-sm text-muted-foreground">• {i}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Asset Optimization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-1">Images</h4>
            <p className="text-sm text-muted-foreground">{d.assetOptimization?.images}</p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Scripts</h4>
            <p className="text-sm text-muted-foreground">{d.assetOptimization?.scripts}</p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Styles</h4>
            <p className="text-sm text-muted-foreground">{d.assetOptimization?.styles}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Core Web Vitals Predictions</CardTitle>
        </CardHeader>
        <CardContent>
          {d.coreWebVitals?.predictions && d.coreWebVitals.predictions.length > 0 && (
            <ul className="space-y-1">
              {d.coreWebVitals.predictions.map((p, i) => (
                <li key={i} className="text-sm text-muted-foreground">• {p}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {d.summary && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{d.summary}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function RecommendationsAnalysis({ data }: { data: Record<string, unknown> | undefined | null }) {
  if (!data) return <NoDataCard />;

  const d = data as {
    quickWins?: { items?: { title: string; description: string; impact: string; effort: string }[]; timeframe?: string };
    strategicChanges?: { items?: { title: string; description: string; impact: string; effort: string }[]; timeframe?: string };
    technicalDebt?: { items?: { issue: string; priority: string; recommendation: string }[] };
    priorityMatrix?: { highImpactLowEffort?: string[]; highImpactHighEffort?: string[]; lowImpactLowEffort?: string[]; lowImpactHighEffort?: string[] };
    roadmap?: { phase1?: string[]; phase2?: string[]; phase3?: string[] };
    summary?: string;
  };

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Quick Wins</CardTitle>
          <CardDescription>Timeframe: {d.quickWins?.timeframe}</CardDescription>
        </CardHeader>
        <CardContent>
          {d.quickWins?.items && d.quickWins.items.length > 0 && (
            <div className="space-y-4">
              {d.quickWins.items.map((item, i) => (
                <div key={i} className="p-4 rounded-lg border">
                  <h4 className="font-medium">{item.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                  <div className="flex gap-4 mt-2">
                    <Badge variant="secondary">Impact: {item.impact}</Badge>
                    <Badge variant="outline">Effort: {item.effort}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Strategic Changes</CardTitle>
          <CardDescription>Timeframe: {d.strategicChanges?.timeframe}</CardDescription>
        </CardHeader>
        <CardContent>
          {d.strategicChanges?.items && d.strategicChanges.items.length > 0 && (
            <div className="space-y-4">
              {d.strategicChanges.items.map((item, i) => (
                <div key={i} className="p-4 rounded-lg border">
                  <h4 className="font-medium">{item.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                  <div className="flex gap-4 mt-2">
                    <Badge variant="secondary">Impact: {item.impact}</Badge>
                    <Badge variant="outline">Effort: {item.effort}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Priority Matrix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {d.priorityMatrix?.highImpactLowEffort && d.priorityMatrix.highImpactLowEffort.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 text-green-600">High Impact, Low Effort</h4>
                <ul className="space-y-1">
                  {d.priorityMatrix.highImpactLowEffort.map((p, i) => (
                    <li key={i} className="text-sm text-muted-foreground">• {p}</li>
                  ))}
                </ul>
              </div>
            )}
            {d.priorityMatrix?.highImpactHighEffort && d.priorityMatrix.highImpactHighEffort.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 text-yellow-600">High Impact, High Effort</h4>
                <ul className="space-y-1">
                  {d.priorityMatrix.highImpactHighEffort.map((p, i) => (
                    <li key={i} className="text-sm text-muted-foreground">• {p}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Implementation Roadmap</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {d.roadmap?.phase1 && d.roadmap.phase1.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Phase 1</h4>
                <ul className="space-y-1">
                  {d.roadmap.phase1.map((p, i) => (
                    <li key={i} className="text-sm text-muted-foreground">• {p}</li>
                  ))}
                </ul>
              </div>
            )}
            {d.roadmap?.phase2 && d.roadmap.phase2.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Phase 2</h4>
                <ul className="space-y-1">
                  {d.roadmap.phase2.map((p, i) => (
                    <li key={i} className="text-sm text-muted-foreground">• {p}</li>
                  ))}
                </ul>
              </div>
            )}
            {d.roadmap?.phase3 && d.roadmap.phase3.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Phase 3</h4>
                <ul className="space-y-1">
                  {d.roadmap.phase3.map((p, i) => (
                    <li key={i} className="text-sm text-muted-foreground">• {p}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {d.summary && (
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{d.summary}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function NoDataCard() {
  return (
    <Card>
      <CardContent className="py-8 text-center">
        <WarningCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-muted-foreground">No analysis data available for this category.</p>
      </CardContent>
    </Card>
  );
}

function ScoreIndicator({ score }: { score: number }) {
  const color =
    score >= 8
      ? "bg-green-500"
      : score >= 6
      ? "bg-yellow-500"
      : score >= 4
      ? "bg-orange-500"
      : "bg-red-500";

  return (
    <div className="flex items-center gap-2">
      <div className={`h-3 w-3 rounded-full ${color}`} />
      <span className="font-bold">{score}/10</span>
    </div>
  );
}
