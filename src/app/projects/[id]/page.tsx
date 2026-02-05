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
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Globe,
  Play,
  Brain,
  FileText,
  ExternalLink,
  Loader2,
  CheckCircle,
  AlertCircle,
  Calendar,
  FileCode,
  Image as ImageIcon,
  Plus,
  Link as LinkIcon,
} from "lucide-react";
import type { Project, Page, Analysis } from "@/types";
import { AnalysisModal } from "@/components/analysis-modal";

interface ProjectData {
  project: Project;
  pages: Page[];
  analyses: Analysis[];
}

export default function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();
  const [data, setData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [scrapeProgress, setScrapeProgress] = useState<{ completed: number; total: number } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [singleUrl, setSingleUrl] = useState("");
  const [scrapingSingle, setScrapingSingle] = useState(false);

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


  async function startScraping() {
    setError(null);
    setScraping(true);
    setScrapeProgress(null);

    try {
      // Start async crawl
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to start scraping");
      }

      // Poll for status
      const pollStatus = async (): Promise<void> => {
        const statusResponse = await fetch(`/api/scrape/status?projectId=${id}`);
        const statusResult = await statusResponse.json();

        if (!statusResponse.ok) {
          throw new Error(statusResult.error || "Failed to check status");
        }

        setScrapeProgress({
          completed: statusResult.completed,
          total: statusResult.total,
        });

        if (statusResult.status === "scraping") {
          // Still in progress, poll again after 2 seconds
          await new Promise((resolve) => setTimeout(resolve, 2000));
          return pollStatus();
        }

        if (statusResult.status === "completed") {
          // Done! Refresh project data
          await fetchProject();
          return;
        }

        if (statusResult.status === "error" || statusResult.status === "failed" || statusResult.status === "cancelled") {
          throw new Error(statusResult.error || `Scraping ${statusResult.status}`);
        }
      };

      await pollStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scraping failed");
    } finally {
      setScraping(false);
      setScrapeProgress(null);
    }
  }

  async function startAnalysis() {
    setError(null);
    setAnalyzing(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: id, type: "all" }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Analysis failed");
      }

      await fetchProject();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }

  async function scrapeSingleUrl() {
    if (!singleUrl.trim()) return;

    setError(null);
    setScrapingSingle(true);

    try {
      const response = await fetch("/api/scrape/single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: id, url: singleUrl.trim() }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to scrape URL");
      }

      setSingleUrl("");
      await fetchProject();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to scrape URL");
    } finally {
      setScrapingSingle(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Project not found</AlertDescription>
      </Alert>
    );
  }

  const { project, pages, analyses } = data;

  // Sort pages: homepage first, then by URL depth and alphabetically
  const sortedPages = [...pages].sort((a, b) => {
    const projectUrl = new URL(project.url);
    const projectHost = projectUrl.hostname;

    // Helper to check if a URL is the homepage
    const isHomepage = (url: string) => {
      try {
        const parsed = new URL(url);
        // Homepage is either exact match to project URL, root path, or just trailing slash
        const pathname = parsed.pathname.replace(/\/$/, "") || "/";
        return (
          parsed.hostname === projectHost &&
          (pathname === "/" || pathname === "" || url === project.url)
        );
      } catch {
        return false;
      }
    };

    // Helper to get URL depth (number of path segments)
    const getUrlDepth = (url: string) => {
      try {
        const parsed = new URL(url);
        const pathname = parsed.pathname.replace(/\/$/, "");
        if (!pathname || pathname === "/") return 0;
        return pathname.split("/").filter(Boolean).length;
      } catch {
        return 999;
      }
    };

    const aIsHome = isHomepage(a.url);
    const bIsHome = isHomepage(b.url);

    // Homepage always first
    if (aIsHome && !bIsHome) return -1;
    if (bIsHome && !aIsHome) return 1;

    // Then sort by depth (shallower URLs first)
    const aDepth = getUrlDepth(a.url);
    const bDepth = getUrlDepth(b.url);
    if (aDepth !== bDepth) return aDepth - bDepth;

    // Finally, alphabetically by URL
    return a.url.localeCompare(b.url);
  });

  const hasScrapedData = pages.length > 0;
  const hasAnalyses = analyses.length > 0;

  return (
    <>
      <AnalysisModal isOpen={analyzing} />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/projects"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
              <StatusBadge status={project.status} />
            </div>
            {project.clientName && (
              <p className="text-muted-foreground">{project.clientName}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasAnalyses && (
            <Link href={`/projects/${id}/report`}>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                View Report
              </Button>
            </Link>
          )}
          {hasAnalyses && (
            <Link href={`/projects/${id}/analysis`}>
              <Button>
                <Brain className="h-4 w-4 mr-2" />
                View Analysis
              </Button>
            </Link>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription className="font-medium">{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Project Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1"
              >
                {project.url}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Created {new Date(project.createdAt).toLocaleDateString()}
            </div>
            <Separator />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <FileCode className="h-4 w-4" />
                  <span className="font-medium">Pages Scraped</span>
                </div>
                <p className="text-2xl font-bold">{pages.length}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-4 w-4" />
                  <span className="font-medium">Analyses Completed</span>
                </div>
                <p className="text-2xl font-bold">{analyses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>Scrape pages and run analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Crawl Website Section */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Crawl Website
              </p>
              <Button
                onClick={startScraping}
                disabled={scraping || analyzing || scrapingSingle}
                className="w-full"
                variant={hasScrapedData ? "outline" : "default"}
              >
                {scraping ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                {scraping
                  ? scrapeProgress && scrapeProgress.total > 0
                    ? `Scraping ${scrapeProgress.completed} of ${scrapeProgress.total}...`
                    : "Starting..."
                  : hasScrapedData
                  ? "Re-scrape Website"
                  : "Start Scraping"}
              </Button>
              {scraping ? (
                <div className="space-y-1">
                  {scrapeProgress && scrapeProgress.total > 0 && (
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div
                        className="bg-primary h-1.5 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.round((scrapeProgress.completed / scrapeProgress.total) * 100)}%`,
                        }}
                      />
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Crawling website and capturing screenshots...
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Crawls up to 10 pages and captures screenshots
                </p>
              )}
            </div>

            <Separator />

            {/* Add Single URL Section */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Add Specific Page
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="url"
                    placeholder="https://example.com/page"
                    value={singleUrl}
                    onChange={(e) => setSingleUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !scrapingSingle) {
                        scrapeSingleUrl();
                      }
                    }}
                    disabled={scrapingSingle || scraping || analyzing}
                    className="pl-8"
                  />
                </div>
                <Button
                  onClick={scrapeSingleUrl}
                  disabled={!singleUrl.trim() || scrapingSingle || scraping || analyzing}
                  size="icon"
                  variant="outline"
                >
                  {scrapingSingle ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {scrapingSingle
                  ? "Scanning page..."
                  : "Add a specific URL to your scraped pages"}
              </p>
            </div>

            <Separator />

            {/* AI Analysis Section */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                AI Analysis
              </p>
              <Button
                onClick={startAnalysis}
                disabled={!hasScrapedData || scraping || analyzing || scrapingSingle}
                className="w-full"
              >
                {analyzing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Brain className="h-4 w-4 mr-2" />
                )}
                {hasAnalyses ? "Re-analyze" : "Run AI Analysis"}
              </Button>
              {analyzing ? (
                <p className="text-xs text-muted-foreground">
                  Analyzing content with AI... This may take a minute.
                </p>
              ) : !hasScrapedData ? (
                <p className="text-xs text-muted-foreground">
                  Scrape the website first to enable analysis
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      {pages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Scraped Pages</CardTitle>
            <CardDescription>
              {pages.length} page{pages.length !== 1 ? "s" : ""} collected from
              the website
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sortedPages.map((page) => (
                <Link
                  key={page.id}
                  href={`/projects/${id}/pages/${page.id}`}
                  className="flex flex-col rounded-lg border overflow-hidden hover:border-primary/50 hover:shadow-md transition-all group"
                >
                  {page.screenshot ? (
                    <div className="relative aspect-video bg-muted overflow-hidden">
                      <img
                        src={page.screenshot}
                        alt={`Screenshot of ${page.title || page.url}`}
                        className="w-full h-full object-cover object-top transition-transform group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                      <div className="overflow-hidden">
                        <p className="font-medium truncate text-sm group-hover:text-primary transition-colors">
                          {page.title || "Untitled Page"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {page.url}
                        </p>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {analyses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Completed Analyses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {analyses.map((analysis) => (
                <Link
                  key={analysis.id}
                  href={`/projects/${id}/analysis?tab=${analysis.type}`}
                  className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <AnalysisIcon type={analysis.type} />
                    <span className="font-medium capitalize">{analysis.type}</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    pending: "secondary",
    scraping: "default",
    scraped: "outline",
    analyzing: "default",
    complete: "default",
    error: "destructive",
  };

  const labels: Record<string, string> = {
    pending: "Pending",
    scraping: "Scraping...",
    scraped: "Ready",
    analyzing: "Analyzing...",
    complete: "Complete",
    error: "Error",
  };

  return (
    <Badge variant={variants[status] || "secondary"}>
      {labels[status] || status}
    </Badge>
  );
}

function AnalysisIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    marketing: <span className="text-blue-500">M</span>,
    techstack: <span className="text-green-500">T</span>,
    architecture: <span className="text-purple-500">A</span>,
    performance: <span className="text-orange-500">P</span>,
    recommendations: <span className="text-red-500">R</span>,
  };

  return (
    <div className="h-6 w-6 rounded bg-muted flex items-center justify-center text-xs font-bold">
      {icons[type] || type[0].toUpperCase()}
    </div>
  );
}
