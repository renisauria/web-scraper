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
import { Textarea } from "@/components/ui/textarea";
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
  Map,
  Pencil,
  X,
  Save,
  MessageSquare,
  Target,
  RefreshCw,
  Trash2,
  Upload,
  ClipboardList,
  StickyNote,
} from "lucide-react";
import type { Project, Page, Analysis, Competitor, CompetitorType } from "@/types";
import { AnalysisModal } from "@/components/analysis-modal";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { MarkdownViewer } from "@/components/ui/markdown-viewer";

interface ProjectData {
  project: Project;
  pages: Page[];
  analyses: Analysis[];
  competitors: Competitor[];
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
  const [editingContext, setEditingContext] = useState(false);
  const [contextForm, setContextForm] = useState({ clientProblems: "", competitorAnalysis: "", projectRequirements: "", clientNotes: "" });
  const [savingContext, setSavingContext] = useState(false);
  const [addingCompetitor, setAddingCompetitor] = useState(false);
  const [competitorForm, setCompetitorForm] = useState({ name: "", url: "", type: "competitor" as CompetitorType, preferredFeature: "", preferredFeatureUrl: "", notes: "" });
  const [savingCompetitor, setSavingCompetitor] = useState(false);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [capturingCompetitorId, setCapturingCompetitorId] = useState<string | null>(null);
  const [viewingCompetitor, setViewingCompetitor] = useState<Competitor | null>(null);
  const [editingCompetitor, setEditingCompetitor] = useState(false);
  const [competitorEditForm, setCompetitorEditForm] = useState({ name: "", url: "", type: "competitor" as CompetitorType, preferredFeature: "", preferredFeatureUrl: "", notes: "" });
  const [savingCompetitorEdit, setSavingCompetitorEdit] = useState(false);
  const [editReferenceImages, setEditReferenceImages] = useState<string[]>([]);
  const [viewingScreenshot, setViewingScreenshot] = useState<{ url: string; title: string } | null>(null);

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

  function startEditingContext() {
    setContextForm({
      clientProblems: data?.project.clientProblems || "",
      competitorAnalysis: data?.project.competitorAnalysis || "",
      projectRequirements: data?.project.projectRequirements || "",
      clientNotes: data?.project.clientNotes || "",
    });
    setEditingContext(true);
  }

  async function saveContext() {
    setSavingContext(true);
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientProblems: contextForm.clientProblems,
          competitorAnalysis: contextForm.competitorAnalysis,
          projectRequirements: contextForm.projectRequirements,
          clientNotes: contextForm.clientNotes,
        }),
      });
      if (!response.ok) throw new Error("Failed to save");
      await fetchProject();
      setEditingContext(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save context");
    } finally {
      setSavingContext(false);
    }
  }

  async function addCompetitor() {
    if (!competitorForm.name.trim() || !competitorForm.url.trim()) return;

    setError(null);
    setSavingCompetitor(true);

    try {
      const response = await fetch("/api/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: id,
          name: competitorForm.name.trim(),
          url: competitorForm.url.trim(),
          type: competitorForm.type,
          preferredFeature: competitorForm.preferredFeature.trim() || undefined,
          preferredFeatureUrl: competitorForm.preferredFeatureUrl.trim() || undefined,
          referenceImages: referenceImages.length ? referenceImages : undefined,
          notes: competitorForm.notes.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to add competitor");
      }

      setCompetitorForm({ name: "", url: "", type: "competitor", preferredFeature: "", preferredFeatureUrl: "", notes: "" });
      setReferenceImages([]);
      setAddingCompetitor(false);
      await fetchProject();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add competitor");
    } finally {
      setSavingCompetitor(false);
    }
  }

  async function recaptureCompetitor(competitorId: string) {
    setError(null);
    setCapturingCompetitorId(competitorId);

    try {
      const response = await fetch(`/api/competitors/${competitorId}`, {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to recapture screenshot");
      }

      if (viewingCompetitor?.id === competitorId && result.competitor) {
        setViewingCompetitor(result.competitor);
      }
      await fetchProject();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to recapture screenshot");
    } finally {
      setCapturingCompetitorId(null);
    }
  }

  async function deleteCompetitor(competitorId: string) {
    setError(null);

    try {
      const response = await fetch(`/api/competitors/${competitorId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to delete competitor");
      }

      await fetchProject();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete competitor");
    }
  }

  function startEditingCompetitor() {
    if (!viewingCompetitor) return;
    setCompetitorEditForm({
      name: viewingCompetitor.name,
      url: viewingCompetitor.url,
      type: viewingCompetitor.type,
      preferredFeature: viewingCompetitor.preferredFeature || "",
      preferredFeatureUrl: viewingCompetitor.preferredFeatureUrl || "",
      notes: viewingCompetitor.notes || "",
    });
    setEditReferenceImages(viewingCompetitor.referenceImages || []);
    setEditingCompetitor(true);
  }

  async function saveCompetitorEdit() {
    if (!viewingCompetitor) return;
    setSavingCompetitorEdit(true);

    try {
      const response = await fetch(`/api/competitors/${viewingCompetitor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: competitorEditForm.name.trim(),
          url: competitorEditForm.url.trim(),
          type: competitorEditForm.type,
          preferredFeature: competitorEditForm.preferredFeature.trim(),
          preferredFeatureUrl: competitorEditForm.preferredFeatureUrl.trim(),
          notes: competitorEditForm.notes.trim(),
          referenceImages: editReferenceImages,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save changes");
      }

      setViewingCompetitor(result.competitor);
      setEditingCompetitor(false);
      await fetchProject();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setSavingCompetitorEdit(false);
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

  const { project, pages, analyses, competitors } = data;

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

      {viewingCompetitor && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => { setViewingCompetitor(null); setEditingCompetitor(false); }}
        >
          <div
            className="bg-background rounded-xl border shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-4">
              {editingCompetitor ? (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Edit Competitor</h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingCompetitor(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Name</label>
                      <Input
                        value={competitorEditForm.name}
                        onChange={(e) => setCompetitorEditForm({ ...competitorEditForm, name: e.target.value })}
                        disabled={savingCompetitorEdit}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">URL</label>
                      <Input
                        type="url"
                        value={competitorEditForm.url}
                        onChange={(e) => setCompetitorEditForm({ ...competitorEditForm, url: e.target.value })}
                        disabled={savingCompetitorEdit}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Type</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="radio"
                            name="editCompetitorType"
                            value="competitor"
                            checked={competitorEditForm.type === "competitor"}
                            onChange={() => setCompetitorEditForm({ ...competitorEditForm, type: "competitor" })}
                            disabled={savingCompetitorEdit}
                            className="accent-primary"
                          />
                          Competitor
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="radio"
                            name="editCompetitorType"
                            value="inspiration"
                            checked={competitorEditForm.type === "inspiration"}
                            onChange={() => setCompetitorEditForm({ ...competitorEditForm, type: "inspiration" })}
                            disabled={savingCompetitorEdit}
                            className="accent-primary"
                          />
                          Inspiration
                        </label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Preferred functionality</label>
                      <Input
                        placeholder="e.g. Interactive product configurator"
                        value={competitorEditForm.preferredFeature}
                        onChange={(e) => setCompetitorEditForm({ ...competitorEditForm, preferredFeature: e.target.value })}
                        disabled={savingCompetitorEdit}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Functionality URL</label>
                      <Input
                        type="url"
                        placeholder="https://competitor.com/feature-page"
                        value={competitorEditForm.preferredFeatureUrl}
                        onChange={(e) => setCompetitorEditForm({ ...competitorEditForm, preferredFeatureUrl: e.target.value })}
                        disabled={savingCompetitorEdit}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Notes</label>
                      <Textarea
                        placeholder="Add notes..."
                        value={competitorEditForm.notes}
                        onChange={(e) => setCompetitorEditForm({ ...competitorEditForm, notes: e.target.value })}
                        rows={4}
                        disabled={savingCompetitorEdit}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Reference screenshots</label>
                      {editReferenceImages.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {editReferenceImages.map((img, i) => (
                            <div key={i} className="relative group/thumb">
                              <img
                                src={img}
                                alt={`Reference ${i + 1}`}
                                className="rounded-md border h-20 w-20 object-cover"
                              />
                              <button
                                type="button"
                                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center text-xs opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                                onClick={() =>
                                  setEditReferenceImages((prev) => prev.filter((_, j) => j !== i))
                                }
                                disabled={savingCompetitorEdit}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <label className="flex items-center gap-2 px-3 py-2 rounded-md border text-sm cursor-pointer hover:bg-muted/50 transition-colors w-fit">
                        <Upload className="h-4 w-4 text-muted-foreground" />
                        <span>Upload images</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          disabled={savingCompetitorEdit}
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            files.forEach((file) => {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setEditReferenceImages((prev) => [...prev, reader.result as string]);
                              };
                              reader.readAsDataURL(file);
                            });
                            e.target.value = "";
                          }}
                        />
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={saveCompetitorEdit}
                      disabled={!competitorEditForm.name.trim() || !competitorEditForm.url.trim() || savingCompetitorEdit}
                    >
                      {savingCompetitorEdit ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditingCompetitor(false)}
                      disabled={savingCompetitorEdit}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold">{viewingCompetitor.name}</h2>
                        <Badge variant={viewingCompetitor.type === "competitor" ? "secondary" : "outline"}>
                          {viewingCompetitor.type === "competitor" ? "Competitor" : "Inspiration"}
                        </Badge>
                      </div>
                      <a
                        href={viewingCompetitor.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {viewingCompetitor.url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={startEditingCompetitor}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setViewingCompetitor(null); setEditingCompetitor(false); }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {viewingCompetitor.preferredFeature && (
                    <div>
                      <p className="text-sm font-medium mb-1">Preferred Functionality</p>
                      {viewingCompetitor.preferredFeatureUrl ? (
                        <a
                          href={viewingCompetitor.preferredFeatureUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          {viewingCompetitor.preferredFeature}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <p className="text-sm text-muted-foreground">{viewingCompetitor.preferredFeature}</p>
                      )}
                    </div>
                  )}

                  {viewingCompetitor.referenceImages && viewingCompetitor.referenceImages.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">
                        Reference Screenshots ({viewingCompetitor.referenceImages.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {viewingCompetitor.referenceImages.map((img, i) => (
                          <button
                            key={i}
                            type="button"
                            className="group/ref cursor-pointer"
                            onClick={() =>
                              setViewingScreenshot({
                                url: img,
                                title: `${viewingCompetitor.name} — Reference ${i + 1}`,
                              })
                            }
                          >
                            <img
                              src={img}
                              alt={`Reference ${i + 1}`}
                              className="rounded-md border h-24 w-24 object-cover group-hover/ref:ring-2 group-hover/ref:ring-primary transition-all"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {viewingCompetitor.screenshot && (
                    <div>
                      <p className="text-sm font-medium mb-2">Auto-captured Screenshot</p>
                      <button
                        type="button"
                        className="group/auto cursor-pointer"
                        onClick={() =>
                          setViewingScreenshot({
                            url: viewingCompetitor.screenshot!,
                            title: `${viewingCompetitor.name} — Auto-captured`,
                          })
                        }
                      >
                        <img
                          src={viewingCompetitor.screenshot}
                          alt={`Auto-captured screenshot of ${viewingCompetitor.name}`}
                          className="rounded-md border h-24 w-auto max-w-full object-cover object-top group-hover/auto:ring-2 group-hover/auto:ring-primary transition-all"
                        />
                      </button>
                    </div>
                  )}

                  {viewingCompetitor.notes && (
                    <div>
                      <p className="text-sm font-medium mb-1">Notes</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{viewingCompetitor.notes}</p>
                    </div>
                  )}

                  <Separator />

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => recaptureCompetitor(viewingCompetitor.id)}
                      disabled={capturingCompetitorId === viewingCompetitor.id}
                    >
                      {capturingCompetitorId === viewingCompetitor.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Recapture Screenshot
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        deleteCompetitor(viewingCompetitor.id);
                        setViewingCompetitor(null);
                        setEditingCompetitor(false);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {viewingScreenshot && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setViewingScreenshot(null)}
        >
          <div className="relative max-w-5xl w-full max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-white font-medium">{viewingScreenshot.title}</p>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => setViewingScreenshot(null)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <img
              src={viewingScreenshot.url}
              alt={`Screenshot of ${viewingScreenshot.title}`}
              className="w-full max-h-[80vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}

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
          {hasScrapedData && (
            <Link href={`/projects/${id}/sitemap`}>
              <Button variant="outline">
                <Map className="h-4 w-4 mr-2" />
                Sitemap
              </Button>
            </Link>
          )}
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

      <Card className="lg:col-span-3">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Client Context</CardTitle>
            {!editingContext && (
              <Button variant="ghost" size="icon" onClick={startEditingContext}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>
          <CardDescription>
            Problems and goals inform AI analysis recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {editingContext ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Client Problems
                </label>
                <MarkdownEditor
                  placeholder="Describe current challenges..."
                  value={contextForm.clientProblems}
                  onChange={(md) =>
                    setContextForm({ ...contextForm, clientProblems: md })
                  }
                  disabled={savingContext}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Competitor Analysis & Desired Features
                </label>
                <MarkdownEditor
                  placeholder="Competitor insights, desired features, and functionality goals..."
                  value={contextForm.competitorAnalysis}
                  onChange={(md) =>
                    setContextForm({ ...contextForm, competitorAnalysis: md })
                  }
                  disabled={savingContext}
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  New Project Requirements
                </label>
                <MarkdownEditor
                  placeholder="What does the new project need to include..."
                  value={contextForm.projectRequirements}
                  onChange={(md) =>
                    setContextForm({ ...contextForm, projectRequirements: md })
                  }
                  disabled={savingContext}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <StickyNote className="h-4 w-4" />
                  Additional Notes from the Client
                </label>
                <MarkdownEditor
                  placeholder="Any other notes or context from the client..."
                  value={contextForm.clientNotes}
                  onChange={(md) =>
                    setContextForm({ ...contextForm, clientNotes: md })
                  }
                  disabled={savingContext}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={saveContext} disabled={savingContext} size="sm">
                  {savingContext ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingContext(false)}
                  disabled={savingContext}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : project.clientProblems || project.competitorAnalysis || project.projectRequirements || project.clientNotes ? (
            <div className="space-y-5">
              {project.clientProblems && (
                <div className="rounded-lg border-l-[3px] border-l-rose-500 bg-rose-50/50 dark:bg-rose-950/20 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                    <h3 className="text-[13px] font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-300">Problems</h3>
                  </div>
                  <div className="text-sm text-foreground/90">
                    <MarkdownViewer content={project.clientProblems} />
                  </div>
                </div>
              )}

              {project.competitorAnalysis && (
                <div className="rounded-lg border-l-[3px] border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-[13px] font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">Competitor Analysis & Desired Features</h3>
                  </div>
                  <div className="text-sm text-foreground/90">
                    <MarkdownViewer content={project.competitorAnalysis} />
                  </div>
                </div>
              )}

              {project.projectRequirements && (
                <div className="rounded-lg border-l-[3px] border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <ClipboardList className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-[13px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">New Project Requirements</h3>
                  </div>
                  <div className="text-sm text-foreground/90">
                    <MarkdownViewer content={project.projectRequirements} />
                  </div>
                </div>
              )}

              {project.clientNotes && (
                <div className="rounded-lg border-l-[3px] border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <StickyNote className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <h3 className="text-[13px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">Additional Notes from the Client</h3>
                  </div>
                  <div className="text-sm text-foreground/90">
                    <MarkdownViewer content={project.clientNotes} />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={startEditingContext}
              className="w-full p-4 rounded-lg border border-dashed text-sm text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors text-center"
            >
              Add client context to improve AI analysis
            </button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Competitors & Inspiration</CardTitle>
              <CardDescription>
                Capture screenshots of competitor and inspiration websites for reference
              </CardDescription>
            </div>
            {!addingCompetitor && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddingCompetitor(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Competitor
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {addingCompetitor && (
            <div className="space-y-3 mb-6 p-4 rounded-lg border bg-muted/30">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  placeholder="e.g. Acme Corp"
                  value={competitorForm.name}
                  onChange={(e) =>
                    setCompetitorForm({ ...competitorForm, name: e.target.value })
                  }
                  disabled={savingCompetitor}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">URL</label>
                <Input
                  type="url"
                  placeholder="https://competitor.com"
                  value={competitorForm.url}
                  onChange={(e) =>
                    setCompetitorForm({ ...competitorForm, url: e.target.value })
                  }
                  disabled={savingCompetitor}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="competitorType"
                      value="competitor"
                      checked={competitorForm.type === "competitor"}
                      onChange={() => setCompetitorForm({ ...competitorForm, type: "competitor" })}
                      disabled={savingCompetitor}
                      className="accent-primary"
                    />
                    Competitor
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="competitorType"
                      value="inspiration"
                      checked={competitorForm.type === "inspiration"}
                      onChange={() => setCompetitorForm({ ...competitorForm, type: "inspiration" })}
                      disabled={savingCompetitor}
                      className="accent-primary"
                    />
                    Inspiration
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Preferred functionality (optional)</label>
                <Input
                  placeholder="e.g. Interactive product configurator"
                  value={competitorForm.preferredFeature}
                  onChange={(e) =>
                    setCompetitorForm({ ...competitorForm, preferredFeature: e.target.value })
                  }
                  disabled={savingCompetitor}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Functionality URL (optional)</label>
                <Input
                  type="url"
                  placeholder="https://competitor.com/feature-page"
                  value={competitorForm.preferredFeatureUrl}
                  onChange={(e) =>
                    setCompetitorForm({ ...competitorForm, preferredFeatureUrl: e.target.value })
                  }
                  disabled={savingCompetitor}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Reference screenshots (optional)</label>
                <label className="flex items-center gap-2 px-3 py-2 rounded-md border text-sm cursor-pointer hover:bg-muted/50 transition-colors w-fit">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span>Upload images</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    disabled={savingCompetitor}
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      files.forEach((file) => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setReferenceImages((prev) => [...prev, reader.result as string]);
                        };
                        reader.readAsDataURL(file);
                      });
                      e.target.value = "";
                    }}
                  />
                </label>
                {referenceImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {referenceImages.map((img, i) => (
                      <div key={i} className="relative group/thumb">
                        <img
                          src={img}
                          alt={`Reference ${i + 1}`}
                          className="rounded-md border h-20 w-20 object-cover"
                        />
                        <button
                          type="button"
                          className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center text-xs opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                          onClick={() =>
                            setReferenceImages((prev) => prev.filter((_, j) => j !== i))
                          }
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Upload screenshots for AI image generation reference
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes (optional)</label>
                <Textarea
                  placeholder="Any notes about this competitor..."
                  value={competitorForm.notes}
                  onChange={(e) =>
                    setCompetitorForm({ ...competitorForm, notes: e.target.value })
                  }
                  rows={2}
                  disabled={savingCompetitor}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={addCompetitor}
                  disabled={
                    !competitorForm.name.trim() ||
                    !competitorForm.url.trim() ||
                    savingCompetitor
                  }
                  size="sm"
                >
                  {savingCompetitor ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ImageIcon className="h-4 w-4 mr-2" />
                  )}
                  {savingCompetitor ? "Capturing..." : "Capture & Save"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAddingCompetitor(false);
                    setCompetitorForm({ name: "", url: "", type: "competitor", preferredFeature: "", preferredFeatureUrl: "", notes: "" });
                    setReferenceImages([]);
                  }}
                  disabled={savingCompetitor}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {competitors.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {competitors.map((comp) => {
                const thumbSrc = comp.referenceImages?.[0] || comp.screenshot;
                return (
                <button
                  key={comp.id}
                  type="button"
                  className="flex flex-col rounded-lg border overflow-hidden hover:border-primary/50 hover:shadow-md transition-all text-left group"
                  onClick={() => setViewingCompetitor(comp)}
                >
                  {thumbSrc ? (
                    <div className="relative aspect-video bg-muted overflow-hidden">
                      <img
                        src={thumbSrc}
                        alt={`Screenshot of ${comp.name}`}
                        className="w-full h-full object-cover object-top transition-transform group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm group-hover:text-primary transition-colors">{comp.name}</p>
                      <Badge variant={comp.type === "competitor" ? "secondary" : "outline"} className="text-[10px] px-1.5 py-0">
                        {comp.type === "competitor" ? "Competitor" : "Inspiration"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {comp.url}
                    </p>
                  </div>
                </button>
                );
              })}
            </div>
          ) : !addingCompetitor ? (
            <button
              onClick={() => setAddingCompetitor(true)}
              className="w-full p-4 rounded-lg border border-dashed text-sm text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors text-center"
            >
              Add competitor or inspiration sites to capture screenshots for reference
            </button>
          ) : null}
        </CardContent>
      </Card>

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
