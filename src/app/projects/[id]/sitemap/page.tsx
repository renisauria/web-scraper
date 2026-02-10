"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Map,
  Brain,
  TreePine,
  Layers,
  Sparkles,
  FileDown,
} from "lucide-react";
import { SitemapTree } from "@/components/sitemap-tree";
import { toast } from "sonner";
import type { SitemapData, SitemapNode } from "@/types";

type TabType = "current" | "recommended";

export default function SitemapPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const [activeTab, setActiveTab] = useState<TabType>("current");
  const [currentSitemap, setCurrentSitemap] = useState<SitemapData | null>(null);
  const [recommendedSitemap, setRecommendedSitemap] = useState<SitemapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scrapingNodeId, setScrapingNodeId] = useState<string | null>(null);
  const [rescrapingNodeId, setRescrapingNodeId] = useState<string | null>(null);
  const [projectUrl, setProjectUrl] = useState<string | null>(null);

  const fetchSitemaps = useCallback(async () => {
    try {
      const response = await fetch(`/api/sitemap?projectId=${id}`);
      if (!response.ok) throw new Error("Failed to fetch sitemaps");
      const data = await response.json();

      for (const sitemap of data.sitemaps) {
        if (sitemap.type === "current") {
          setCurrentSitemap(sitemap.data as SitemapData);
        } else if (sitemap.type === "recommended") {
          setRecommendedSitemap(sitemap.data as SitemapData);
        }
      }
    } catch (err) {
      console.error("Error fetching sitemaps:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSitemaps();
  }, [fetchSitemaps]);

  useEffect(() => {
    async function fetchProjectUrl() {
      try {
        const res = await fetch(`/api/projects/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProjectUrl(data.project?.url || null);
        }
      } catch {
        // non-critical, URL construction will fall back
      }
    }
    fetchProjectUrl();
  }, [id]);

  async function generateSitemap(type: TabType) {
    setError(null);
    setGenerating(true);
    const label = type === "current" ? "sitemap" : "AI sitemap";
    toast.info(`Generating ${label}...`);

    try {
      const response = await fetch("/api/sitemap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: id, type }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to generate sitemap");
      }

      const sitemapData = result.sitemap.data as SitemapData;
      if (type === "current") {
        setCurrentSitemap(sitemapData);
      } else {
        setRecommendedSitemap(sitemapData);
      }
      toast.success(`${type === "current" ? "Sitemap" : "AI sitemap"} generated`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate sitemap";
      setError(msg);
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  }

  async function importFromSitemapXml() {
    setError(null);
    setImporting(true);
    toast.info("Fetching sitemap.xml...");

    try {
      const response = await fetch("/api/sitemap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: id, type: "current", source: "import-xml" }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to import sitemap.xml");
      }

      const sitemapData = result.sitemap.data as SitemapData;
      setCurrentSitemap(sitemapData);
      setActiveTab("current");

      const stats = result.importStats;
      if (stats) {
        const subMsg = stats.childSitemapsFound > 0
          ? ` (${stats.childSitemapsFound} sub-sitemaps)`
          : "";
        toast.success(`Imported ${stats.urlCount} pages from sitemap.xml${subMsg}`);
      } else {
        toast.success("Sitemap imported successfully");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to import sitemap.xml";
      setError(msg);
      toast.error(msg);
    } finally {
      setImporting(false);
    }
  }

  function markNodeScraped(node: SitemapNode, targetId: string, pageId?: string): SitemapNode {
    if (node.id === targetId) {
      return {
        ...node,
        hasContent: true,
        metadata: { ...node.metadata, ...(pageId ? { pageId } : {}) },
      };
    }
    return {
      ...node,
      children: node.children.map((c) => markNodeScraped(c, targetId, pageId)),
    };
  }

  async function handleScrapeNode(node: SitemapNode) {
    const fullUrl = node.url || (projectUrl ? projectUrl.replace(/\/$/, "") + node.path : null);
    if (!fullUrl) {
      toast.error("Cannot determine full URL for this page");
      return;
    }

    setScrapingNodeId(node.id);
    try {
      const res = await fetch("/api/scrape/single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: id, url: fullUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to scrape page");
      }
      toast.success(`Scraped "${node.label}" successfully`);
      setCurrentSitemap((prev) =>
        prev ? { ...prev, rootNode: markNodeScraped(prev.rootNode, node.id, data.page?.id) } : prev
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to scrape page";
      toast.error(msg);
    } finally {
      setScrapingNodeId(null);
    }
  }

  async function handleRescrapeNode(node: SitemapNode) {
    const pageId = node.metadata?.pageId;
    if (!pageId) {
      toast.error("No page ID found — regenerate the sitemap to enable re-scraping");
      return;
    }

    setRescrapingNodeId(node.id);
    try {
      const res = await fetch(`/api/pages/${pageId}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to re-scrape page");
      }
      toast.success(`Re-scraped "${node.label}" — now at version ${data.newVersion}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to re-scrape page";
      toast.error(msg);
    } finally {
      setRescrapingNodeId(null);
    }
  }

  const activeSitemap = activeTab === "current" ? currentSitemap : recommendedSitemap;

  const sitemapStats = useMemo(() => {
    if (!activeSitemap) return null;
    const typeCount: Record<string, number> = {};
    const depthCount: Record<number, number> = {};
    let withContent = 0;
    let total = 0;

    function walk(node: SitemapData["rootNode"], depth: number) {
      total++;
      const pt = node.pageType || "other";
      typeCount[pt] = (typeCount[pt] || 0) + 1;
      depthCount[depth] = (depthCount[depth] || 0) + 1;
      if (node.hasContent) withContent++;
      for (const child of node.children) walk(child, depth + 1);
    }
    walk(activeSitemap.rootNode, 0);

    const typeLabels: Record<string, string> = {
      homepage: "Homepage",
      collection: "Collections",
      product: "Products",
      page: "Pages",
      blog: "Blogs",
      article: "Articles",
      other: "Other",
    };

    const types = Object.entries(typeCount)
      .map(([key, count]) => ({ key, label: typeLabels[key] || key, count }))
      .sort((a, b) => b.count - a.count);

    const maxTypeCount = Math.max(...types.map((t) => t.count), 1);

    const depths = Object.entries(depthCount)
      .map(([d, count]) => ({ depth: Number(d), count }))
      .sort((a, b) => a.depth - b.depth);

    const maxDepthCount = Math.max(...depths.map((d) => d.count), 1);

    return { types, maxTypeCount, depths, maxDepthCount, withContent, total };
  }, [activeSitemap]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/projects/${id}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Project
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Map className="h-6 w-6" />
        <h1 className="text-2xl font-bold tracking-tight">Sitemap</h1>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === "current" ? "default" : "outline"}
          onClick={() => setActiveTab("current")}
          size="sm"
        >
          <TreePine className="h-4 w-4 mr-2" />
          Current Sitemap
        </Button>
        <Button
          variant={activeTab === "recommended" ? "default" : "outline"}
          onClick={() => setActiveTab("recommended")}
          size="sm"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Recommended Sitemap
        </Button>
      </div>

      {/* Content */}
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {activeTab === "current" ? "Current Site Structure" : "AI-Recommended Structure"}
                  </CardTitle>
                  <CardDescription>
                    {activeTab === "current"
                      ? "Tree view of pages discovered during scraping"
                      : "AI-optimized information architecture with Shopify best practices"}
                  </CardDescription>
                </div>
                <Button
                  onClick={() => generateSitemap(activeTab)}
                  disabled={generating || importing}
                  size="sm"
                >
                  {generating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : activeTab === "current" ? (
                    <TreePine className="h-4 w-4 mr-2" />
                  ) : (
                    <Brain className="h-4 w-4 mr-2" />
                  )}
                  {generating
                    ? "Generating..."
                    : activeSitemap
                    ? "Regenerate"
                    : activeTab === "current"
                    ? "Generate Sitemap"
                    : "Generate AI Sitemap"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {activeSitemap ? (
                <div>
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b">
                    <span className="text-sm text-muted-foreground">
                      {activeSitemap.totalPages} {activeSitemap.totalPages === 1 ? "page" : "pages"} total
                    </span>
                  </div>
                  <SitemapTree
                    node={activeSitemap.rootNode}
                    variant={activeTab}
                    defaultExpandDepth={3}
                    onScrapeNode={activeTab === "current" ? handleScrapeNode : undefined}
                    scrapingId={scrapingNodeId}
                    baseUrl={projectUrl}
                    onRescrapeNode={activeTab === "current" ? handleRescrapeNode : undefined}
                    rescrapingId={rescrapingNodeId}
                    projectId={id}
                  />
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Map className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">
                    No {activeTab} sitemap generated yet
                  </p>
                  <p className="text-sm">
                    {activeTab === "current"
                      ? "Click \"Generate Sitemap\" to build a tree from your scraped pages"
                      : "Click \"Generate AI Sitemap\" for AI-powered IA recommendations"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats sidebar */}
        <div className="space-y-6">
          {sitemapStats && (
            <>
              {/* Page Type Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Page Types</CardTitle>
                  <CardDescription className="text-xs">
                    {sitemapStats.total} pages across {sitemapStats.types.length} types
                    {activeSitemap && (
                      <span className="block mt-1 text-muted-foreground/70">
                        Collected {new Date(activeSitemap.generatedAt).toLocaleDateString()} at{" "}
                        {new Date(activeSitemap.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {sitemapStats.types.map(({ key, label, count }) => (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-medium tabular-nums">{count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary/60 transition-all"
                          style={{ width: `${(count / sitemapStats.maxTypeCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Depth Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Depth Distribution</CardTitle>
                  <CardDescription className="text-xs">
                    Pages per level in the URL hierarchy
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {sitemapStats.depths.map(({ depth, count }) => (
                    <div key={depth} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {depth === 0 ? "Root" : `Level ${depth}`}
                        </span>
                        <span className="font-medium tabular-nums">{count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary/40 transition-all"
                          style={{ width: `${(count / sitemapStats.maxDepthCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Content Coverage */}
              {sitemapStats.withContent > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Content Coverage</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Scraped</span>
                      <Badge variant="secondary">{sitemapStats.withContent} / {sitemapStats.total}</Badge>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-green-500/70 transition-all"
                        style={{ width: `${(sitemapStats.withContent / sitemapStats.total) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {Math.round((sitemapStats.withContent / sitemapStats.total) * 100)}% of pages have scraped content
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Import from sitemap.xml */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Import from sitemap.xml</CardTitle>
              <CardDescription className="text-xs">
                Fetch the site&apos;s sitemap.xml to build the full URL tree instantly, no scraping needed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={importFromSitemapXml}
                disabled={importing || generating}
                className="w-full"
                variant="outline"
                size="sm"
              >
                {importing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4 mr-2" />
                )}
                {importing ? "Importing..." : "Import Sitemap"}
              </Button>
            </CardContent>
          </Card>

          {/* AI Rationale card - only for recommended */}
          {activeTab === "recommended" && recommendedSitemap?.aiRationale && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">AI Rationale</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {recommendedSitemap.aiRationale}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Key Changes card - only for recommended */}
          {activeTab === "recommended" &&
            recommendedSitemap?.keyChanges &&
            recommendedSitemap.keyChanges.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Key Changes</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {recommendedSitemap.keyChanges.map((change, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex gap-2">
                        <Layers className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
        </div>
      </div>
    </div>
  );
}
