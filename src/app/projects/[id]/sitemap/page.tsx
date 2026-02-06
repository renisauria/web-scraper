"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { SitemapTree } from "@/components/sitemap-tree";
import type { SitemapData } from "@/types";

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
  const [error, setError] = useState<string | null>(null);

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

  async function generateSitemap(type: TabType) {
    setError(null);
    setGenerating(true);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate sitemap");
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const activeSitemap = activeTab === "current" ? currentSitemap : recommendedSitemap;

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
                  disabled={generating}
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
                <SitemapTree
                  node={activeSitemap.rootNode}
                  variant={activeTab}
                  defaultExpandDepth={3}
                />
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
          {activeSitemap && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Pages</span>
                  <Badge variant="secondary">{activeSitemap.totalPages}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Max Depth</span>
                  <Badge variant="secondary">{activeSitemap.maxDepth}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Generated</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(activeSitemap.generatedAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

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
