"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Download,
  Copy,
  Check,
  BarChart3,
  Code2,
  Layout,
  Zap,
  Lightbulb,
} from "lucide-react";
import type { Project, Analysis } from "@/types";

interface ProjectData {
  project: Project;
  analyses: Analysis[];
}

export default function ReportPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();
  const [data, setData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

  function generateMarkdown(): string {
    if (!data) return "";

    const { project, analyses } = data;
    const analysisMap = new Map(analyses.map((a) => [a.type, a.content]));

    let md = `# Website Analysis Report: ${project.name}\n\n`;
    md += `**Website:** ${project.url}\n`;
    if (project.clientName) {
      md += `**Client:** ${project.clientName}\n`;
    }
    md += `**Generated:** ${new Date().toLocaleDateString()}\n\n`;
    md += `---\n\n`;

    // Marketing
    const marketing = analysisMap.get("marketing") as Record<string, unknown> | undefined;
    if (marketing) {
      md += `## Marketing Analysis\n\n`;
      if (marketing.summary) {
        md += `${marketing.summary}\n\n`;
      }
      const seo = marketing.seo as { score?: number; findings?: string[]; improvements?: string[] } | undefined;
      if (seo) {
        md += `### SEO Score: ${seo.score}/10\n\n`;
        if (seo.findings && (seo.findings as string[]).length > 0) {
          md += `**Findings:**\n`;
          (seo.findings as string[]).forEach((f) => (md += `- ${f}\n`));
          md += `\n`;
        }
        if (seo.improvements && (seo.improvements as string[]).length > 0) {
          md += `**Improvements:**\n`;
          (seo.improvements as string[]).forEach((i) => (md += `- ${i}\n`));
          md += `\n`;
        }
      }
      md += `---\n\n`;
    }

    // Tech Stack
    const techstack = analysisMap.get("techstack") as Record<string, unknown> | undefined;
    if (techstack) {
      md += `## Technology Stack\n\n`;
      if (techstack.summary) {
        md += `${techstack.summary}\n\n`;
      }
      const frameworks = techstack.frameworks as { frontend?: string[]; backend?: string[] } | undefined;
      if (frameworks) {
        if (frameworks.frontend && frameworks.frontend.length > 0) {
          md += `**Frontend:** ${frameworks.frontend.join(", ")}\n`;
        }
        if (frameworks.backend && frameworks.backend.length > 0) {
          md += `**Backend:** ${frameworks.backend.join(", ")}\n`;
        }
      }
      const cms = techstack.cms as { identified?: string | null } | undefined;
      if (cms?.identified) {
        md += `**CMS:** ${cms.identified}\n`;
      }
      const hosting = techstack.hosting as { likelyProvider?: string } | undefined;
      if (hosting?.likelyProvider) {
        md += `**Hosting:** ${hosting.likelyProvider}\n`;
      }
      md += `\n---\n\n`;
    }

    // Architecture
    const architecture = analysisMap.get("architecture") as Record<string, unknown> | undefined;
    if (architecture) {
      md += `## Site Architecture\n\n`;
      if (architecture.summary) {
        md += `${architecture.summary}\n\n`;
      }
      const urlStructure = architecture.urlStructure as { seoFriendly?: boolean; pattern?: string } | undefined;
      if (urlStructure) {
        md += `**URL Structure:** ${urlStructure.pattern}\n`;
        md += `**SEO Friendly:** ${urlStructure.seoFriendly ? "Yes" : "No"}\n`;
      }
      md += `\n---\n\n`;
    }

    // Performance
    const performance = analysisMap.get("performance") as Record<string, unknown> | undefined;
    if (performance) {
      md += `## Performance Analysis\n\n`;
      if (performance.summary) {
        md += `${performance.summary}\n\n`;
      }
      const mobile = performance.mobileResponsiveness as { score?: number } | undefined;
      if (mobile?.score) {
        md += `**Mobile Responsiveness Score:** ${mobile.score}/10\n\n`;
      }
      md += `---\n\n`;
    }

    // Recommendations
    const recommendations = analysisMap.get("recommendations") as Record<string, unknown> | undefined;
    if (recommendations) {
      md += `## Recommendations\n\n`;
      if (recommendations.summary) {
        md += `${recommendations.summary}\n\n`;
      }
      const quickWins = recommendations.quickWins as { items?: { title: string; description: string }[] } | undefined;
      if (quickWins?.items && quickWins.items.length > 0) {
        md += `### Quick Wins\n\n`;
        quickWins.items.forEach((item) => {
          md += `- **${item.title}**: ${item.description}\n`;
        });
        md += `\n`;
      }
      const strategic = recommendations.strategicChanges as { items?: { title: string; description: string }[] } | undefined;
      if (strategic?.items && strategic.items.length > 0) {
        md += `### Strategic Changes\n\n`;
        strategic.items.forEach((item) => {
          md += `- **${item.title}**: ${item.description}\n`;
        });
        md += `\n`;
      }
      const roadmap = recommendations.roadmap as { phase1?: string[]; phase2?: string[]; phase3?: string[] } | undefined;
      if (roadmap) {
        md += `### Implementation Roadmap\n\n`;
        if (roadmap.phase1 && roadmap.phase1.length > 0) {
          md += `**Phase 1:**\n`;
          roadmap.phase1.forEach((p) => (md += `- ${p}\n`));
          md += `\n`;
        }
        if (roadmap.phase2 && roadmap.phase2.length > 0) {
          md += `**Phase 2:**\n`;
          roadmap.phase2.forEach((p) => (md += `- ${p}\n`));
          md += `\n`;
        }
        if (roadmap.phase3 && roadmap.phase3.length > 0) {
          md += `**Phase 3:**\n`;
          roadmap.phase3.forEach((p) => (md += `- ${p}\n`));
        }
      }
    }

    md += `\n---\n\n*Report generated by Website Analyzer*\n`;

    return md;
  }

  async function copyToClipboard() {
    const markdown = generateMarkdown();
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadMarkdown() {
    const markdown = generateMarkdown();
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data?.project.name || "report"}-analysis.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || data.analyses.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
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
            <h1 className="text-2xl font-bold tracking-tight">Analysis Report</h1>
            <p className="text-muted-foreground">{project.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={copyToClipboard}>
            {copied ? (
              <Check className="h-4 w-4 mr-2" />
            ) : (
              <Copy className="h-4 w-4 mr-2" />
            )}
            {copied ? "Copied!" : "Copy Markdown"}
          </Button>
          <Button onClick={downloadMarkdown}>
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Report Preview</CardTitle>
          <CardDescription>
            A summary of all analysis findings for {project.url}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Executive Summary */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Executive Summary</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard
                icon={<BarChart3 className="h-5 w-5 text-blue-500" />}
                title="Marketing"
                status={analysisMap.has("marketing")}
              />
              <SummaryCard
                icon={<Code2 className="h-5 w-5 text-green-500" />}
                title="Tech Stack"
                status={analysisMap.has("techstack")}
              />
              <SummaryCard
                icon={<Layout className="h-5 w-5 text-purple-500" />}
                title="Architecture"
                status={analysisMap.has("architecture")}
              />
              <SummaryCard
                icon={<Zap className="h-5 w-5 text-orange-500" />}
                title="Performance"
                status={analysisMap.has("performance")}
              />
            </div>
          </section>

          <Separator />

          {/* Key Findings */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Key Findings</h2>
            <div className="space-y-4">
              {analysisMap.has("marketing") && (
                <FindingItem
                  icon={<BarChart3 className="h-4 w-4" />}
                  title="Marketing"
                  summary={(analysisMap.get("marketing") as Record<string, unknown>)?.summary as string}
                />
              )}
              {analysisMap.has("techstack") && (
                <FindingItem
                  icon={<Code2 className="h-4 w-4" />}
                  title="Tech Stack"
                  summary={(analysisMap.get("techstack") as Record<string, unknown>)?.summary as string}
                />
              )}
              {analysisMap.has("architecture") && (
                <FindingItem
                  icon={<Layout className="h-4 w-4" />}
                  title="Architecture"
                  summary={(analysisMap.get("architecture") as Record<string, unknown>)?.summary as string}
                />
              )}
              {analysisMap.has("performance") && (
                <FindingItem
                  icon={<Zap className="h-4 w-4" />}
                  title="Performance"
                  summary={(analysisMap.get("performance") as Record<string, unknown>)?.summary as string}
                />
              )}
            </div>
          </section>

          <Separator />

          {/* Top Recommendations */}
          {analysisMap.has("recommendations") && (
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Top Recommendations
              </h2>
              <RecommendationsSummary
                data={analysisMap.get("recommendations") as Record<string, unknown>}
              />
            </section>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Raw Markdown</CardTitle>
          <CardDescription>Copy or download the full report</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="p-4 bg-muted rounded-lg overflow-auto max-h-96 text-sm">
            {generateMarkdown()}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  icon,
  title,
  status,
}: {
  icon: React.ReactNode;
  title: string;
  status: boolean;
}) {
  return (
    <div className="p-4 rounded-lg border">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="font-medium">{title}</p>
          <Badge variant={status ? "default" : "secondary"}>
            {status ? "Analyzed" : "Not Available"}
          </Badge>
        </div>
      </div>
    </div>
  );
}

function FindingItem({
  icon,
  title,
  summary,
}: {
  icon: React.ReactNode;
  title: string;
  summary?: string;
}) {
  return (
    <div className="p-4 rounded-lg border">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {summary || "No summary available"}
          </p>
        </div>
      </div>
    </div>
  );
}

function RecommendationsSummary({ data }: { data: Record<string, unknown> }) {
  const quickWins = data?.quickWins as { items?: { title: string; description: string }[] } | undefined;
  const strategic = data?.strategicChanges as { items?: { title: string; description: string }[] } | undefined;

  const items = [
    ...(quickWins?.items?.slice(0, 2) || []),
    ...(strategic?.items?.slice(0, 2) || []),
  ];

  if (items.length === 0) {
    return <p className="text-muted-foreground">No recommendations available</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item, i) => (
        <div key={i} className="p-4 rounded-lg border">
          <h4 className="font-medium">{item.title}</h4>
          <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
        </div>
      ))}
    </div>
  );
}
