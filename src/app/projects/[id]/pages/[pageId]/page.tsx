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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ChevronRight,
  Globe,
  ExternalLink,
  Loader2,
  AlertCircle,
  Calendar,
  RefreshCw,
  FileText,
  Image as ImageIcon,
  Code,
  Tags,
  Info,
  History,
  Clock,
  Eye,
  Camera,
  Maximize2,
  Trash2,
} from "lucide-react";
import type { Page, PageVersion, Project } from "@/types";

function formatVersionDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface PageData {
  page: Page;
  project: Project | null;
  versions: PageVersion[];
}

export default function PageDetailView({
  params,
}: {
  params: { id: string; pageId: string };
}) {
  const { id: projectId, pageId } = params;
  const router = useRouter();
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rescraping, setRescraping] = useState(false);
  const [capturingFullPage, setCapturingFullPage] = useState(false);
  const [deletingVersionId, setDeletingVersionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewingScreenshot, setViewingScreenshot] = useState<{ url: string; title: string } | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<PageVersion | null>(null);

  const fetchPage = useCallback(async () => {
    try {
      const response = await fetch(`/api/pages/${pageId}`);
      if (!response.ok) {
        if (response.status === 404) {
          router.push(`/projects/${projectId}`);
          return;
        }
        throw new Error("Failed to fetch page");
      }
      const pageData = await response.json();
      setData(pageData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [pageId, projectId, router]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setViewingScreenshot(null);
        setSelectedVersion(null);
      }
    }
    if (viewingScreenshot || selectedVersion) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [viewingScreenshot, selectedVersion]);

  async function handleRescrape() {
    setError(null);
    setRescraping(true);

    try {
      const response = await fetch(`/api/pages/${pageId}`, {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to re-scrape page");
      }

      await fetchPage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to re-scrape");
    } finally {
      setRescraping(false);
    }
  }

  async function handleCaptureFullPage() {
    setError(null);
    setCapturingFullPage(true);

    try {
      const response = await fetch(`/api/pages/${pageId}/screenshot`, {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to capture full-page screenshot");
      }

      await fetchPage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to capture screenshot");
    } finally {
      setCapturingFullPage(false);
    }
  }

  async function handleDeleteVersion(versionId: string) {
    if (!confirm("Are you sure you want to delete this version? This cannot be undone.")) {
      return;
    }

    setError(null);
    setDeletingVersionId(versionId);

    try {
      const response = await fetch(`/api/pages/${pageId}/versions/${versionId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete version");
      }

      await fetchPage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete version");
    } finally {
      setDeletingVersionId(null);
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
        <AlertCircle className="h-5 w-5" />
        <AlertDescription className="font-medium">Page not found</AlertDescription>
      </Alert>
    );
  }

  const { page, project, versions } = data;
  const metadata = page.metadata as Record<string, unknown> | null;
  const hasVersionHistory = versions && versions.length > 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center text-sm text-muted-foreground">
        <Link href="/projects" className="hover:text-foreground transition-colors">
          Projects
        </Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <Link
          href={`/projects/${projectId}`}
          className="hover:text-foreground transition-colors"
        >
          {project?.name || "Project"}
        </Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <span className="text-foreground font-medium truncate max-w-[200px]">
          {page.title || "Untitled Page"}
        </span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight truncate">
              {page.title || "Untitled Page"}
            </h1>
            <Badge variant="secondary">{formatVersionDate(page.createdAt)}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
            <a
              href={page.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline flex items-center gap-1 truncate"
            >
              {page.url}
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          </div>
        </div>
        <Button
          onClick={handleRescrape}
          disabled={rescraping}
          variant="outline"
          className="shrink-0"
        >
          {rescraping ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          {rescraping ? "Scraping..." : "Scrape Again"}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription className="font-medium">{error}</AlertDescription>
        </Alert>
      )}

      {/* Version History */}
      {hasVersionHistory && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Version History
            </CardTitle>
            <CardDescription>
              {versions.length} previous version{versions.length !== 1 ? "s" : ""} available
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Current version */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-3">
                  <Badge>{formatVersionDate(page.createdAt)}</Badge>
                  <div>
                    <p className="font-medium text-sm">{page.title || "Untitled"}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(page.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">Current</Badge>
              </div>

              {/* Previous versions */}
              {versions.map((version) => (
                <div
                  key={version.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{formatVersionDate(version.createdAt)}</Badge>
                    <div>
                      <p className="font-medium text-sm">{version.title || "Untitled"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedVersion(version)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteVersion(version.id)}
                      disabled={deletingVersionId === version.id}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      {deletingVersionId === version.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Screenshots */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Screenshots
                </CardTitle>
                <CardDescription>Viewport and full-page captures at 1920x1080</CardDescription>
              </div>
              <Button
                onClick={handleCaptureFullPage}
                disabled={capturingFullPage || rescraping}
                variant="outline"
                size="sm"
              >
                {capturingFullPage ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4 mr-2" />
                )}
                {capturingFullPage ? "Capturing..." : page.fullPageScreenshot ? "Recapture Full Page" : "Get Full-Page Screenshot"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Viewport Screenshot */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Viewport Screenshot
                </p>
                {page.screenshot ? (
                  <button
                    onClick={() => setViewingScreenshot({ url: page.screenshot!, title: "Viewport Screenshot" })}
                    className="w-full rounded-lg border overflow-hidden group cursor-pointer"
                  >
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={page.screenshot}
                        alt={`Viewport screenshot of ${page.title || page.url}`}
                        className="w-full h-full object-cover object-top transition-transform group-hover:scale-105"
                      />
                    </div>
                    <div className="p-2 bg-muted/50 text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                      <Maximize2 className="h-3 w-3" />
                      Click to expand
                    </div>
                  </button>
                ) : (
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border">
                    <div className="text-center text-muted-foreground">
                      <ImageIcon className="h-8 w-8 mx-auto mb-1 opacity-50" />
                      <p className="text-xs">No screenshot</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Full-Page Screenshot */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Full-Page Screenshot
                </p>
                {page.fullPageScreenshot ? (
                  <button
                    onClick={() => setViewingScreenshot({ url: page.fullPageScreenshot!, title: "Full-Page Screenshot" })}
                    className="w-full rounded-lg border overflow-hidden group cursor-pointer"
                  >
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={page.fullPageScreenshot}
                        alt={`Full-page screenshot of ${page.title || page.url}`}
                        className="w-full h-full object-cover object-top transition-transform group-hover:scale-105"
                      />
                    </div>
                    <div className="p-2 bg-muted/50 text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                      <Maximize2 className="h-3 w-3" />
                      Click to expand
                    </div>
                  </button>
                ) : (
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border border-dashed">
                    <div className="text-center text-muted-foreground">
                      <Camera className="h-8 w-8 mx-auto mb-1 opacity-50" />
                      <p className="text-xs">Not captured yet</p>
                      <p className="text-xs opacity-70">Click button above</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Page Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Page Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Scraped On
              </p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{new Date(page.createdAt).toLocaleString()}</span>
              </div>
            </div>

            {metadata && "description" in metadata && metadata.description ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Meta Description
                </p>
                <p className="text-sm">{String(metadata.description)}</p>
              </div>
            ) : null}

            {metadata && "language" in metadata && metadata.language ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Language
                </p>
                <Badge variant="secondary">{String(metadata.language)}</Badge>
              </div>
            ) : null}

            {metadata && "ogImage" in metadata && metadata.ogImage ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  OG Image
                </p>
                <img
                  src={String(metadata.ogImage)}
                  alt="Open Graph"
                  className="w-full rounded border"
                />
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Metadata Details */}
      {metadata && Object.keys(metadata).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tags className="h-5 w-5" />
              Metadata
            </CardTitle>
            <CardDescription>
              SEO and meta information extracted from the page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(metadata).map(([key, value]) => {
                if (!value || key === "sourceURL") return null;
                const displayValue =
                  typeof value === "object"
                    ? JSON.stringify(value, null, 2)
                    : String(value);

                if (displayValue.length > 200 || key === "ogImage") return null;

                return (
                  <div key={key} className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </p>
                    <p className="text-sm break-words">{displayValue}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Page Content */}
      {page.content && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Page Content
            </CardTitle>
            <CardDescription>
              Extracted markdown content from the page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border bg-muted/30 p-4 max-h-[500px] overflow-auto">
              <pre className="text-sm whitespace-pre-wrap font-mono">
                {page.content}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Raw Metadata JSON */}
      {metadata && Object.keys(metadata).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Raw Metadata
            </CardTitle>
            <CardDescription>Complete metadata object as JSON</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border bg-muted/30 p-4 max-h-[300px] overflow-auto">
              <pre className="text-xs whitespace-pre-wrap font-mono">
                {JSON.stringify(metadata, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Screenshot Modal */}
      {viewingScreenshot && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setViewingScreenshot(null)}
        >
          <div className="relative max-w-6xl max-h-[90vh] w-full overflow-auto">
            <div className="fixed top-4 right-4 flex items-center gap-2">
              <span className="text-white text-sm bg-black/50 px-3 py-1 rounded">
                {viewingScreenshot.title}
              </span>
              <button
                onClick={() => setViewingScreenshot(null)}
                className="text-white hover:text-gray-300 text-sm bg-black/50 px-3 py-1 rounded"
              >
                Close (Esc)
              </button>
            </div>
            <img
              src={viewingScreenshot.url}
              alt={viewingScreenshot.title}
              className="w-full h-auto rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Version View Modal */}
      {selectedVersion && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedVersion(null)}
        >
          <div
            className="relative bg-background rounded-lg max-w-4xl max-h-[90vh] w-full overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="outline">{formatVersionDate(selectedVersion.createdAt)}</Badge>
                <div>
                  <h2 className="font-semibold">{selectedVersion.title || "Untitled"}</h2>
                  <p className="text-xs text-muted-foreground">
                    {new Date(selectedVersion.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedVersion(null)}>
                Close
              </Button>
            </div>

            <div className="p-4 space-y-6">
              {/* Version Screenshots */}
              {(selectedVersion.screenshot || selectedVersion.fullPageScreenshot) && (
                <div>
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Screenshots
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {selectedVersion.screenshot && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Viewport</p>
                        <img
                          src={selectedVersion.screenshot}
                          alt={`Viewport screenshot of ${selectedVersion.title}`}
                          className="w-full rounded-lg border"
                        />
                      </div>
                    )}
                    {selectedVersion.fullPageScreenshot && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Full Page</p>
                        <img
                          src={selectedVersion.fullPageScreenshot}
                          alt={`Full-page screenshot of ${selectedVersion.title}`}
                          className="w-full rounded-lg border"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Version Content */}
              {selectedVersion.content && (
                <div>
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Content
                  </h3>
                  <div className="rounded-lg border bg-muted/30 p-4 max-h-[300px] overflow-auto">
                    <pre className="text-sm whitespace-pre-wrap font-mono">
                      {selectedVersion.content}
                    </pre>
                  </div>
                </div>
              )}

              {/* Version Metadata */}
              {selectedVersion.metadata && Object.keys(selectedVersion.metadata).length > 0 && (
                <div>
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Metadata
                  </h3>
                  <div className="rounded-lg border bg-muted/30 p-4 max-h-[200px] overflow-auto">
                    <pre className="text-xs whitespace-pre-wrap font-mono">
                      {JSON.stringify(selectedVersion.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
