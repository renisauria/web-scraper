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
  ArrowSquareOut,
  SpinnerGap,
  CheckCircle,
  WarningCircle,
  Warning,
  CalendarBlank,
  FileCode,
  Image as ImageIcon,
  Plus,
  Link as LinkIcon,
  MapTrifold,
  PencilSimple,
  X,
  FloppyDisk,
  Chat,
  Crosshair,
  ArrowsClockwise,
  Trash,
  UploadSimple,
  ClipboardText,
  Note,
  MagicWand,
  Sparkle,
  BookmarkSimple,
  CaretDown,
  CaretRight,
  ShoppingBag,
  Package,
  DownloadSimple,
  GridFour,
  TreeStructure,
  Circle,
  ThumbsUp,
  ThumbsDown,
  Star,
  Monitor,
  Copy,
  Check,
  Buildings,
  ChartBar,
  CodeBlock,
  Lightning,
  Lightbulb,
  ArrowRight,
  Archive,
  ArrowCounterClockwise,
  ClockCounterClockwise,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import type { Project, Page, Analysis, Competitor, CompetitorType, ScreenshotLabel, Mockup, SavedPrompt, Product, ReferenceImage } from "@/types";
import { normalizeReferenceImages } from "@/types";
import { formatDate, formatDateShort } from "@/lib/format-date";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AnalysisModal } from "@/components/analysis-modal";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { MarkdownViewer } from "@/components/ui/markdown-viewer";

interface ProjectData {
  project: Project;
  pages: Page[];
  analyses: Analysis[];
  competitors: Competitor[];
  mockups: Mockup[];
  savedPrompts: SavedPrompt[];
  products: Product[];
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
  const [scrapeLimit, setScrapeLimit] = useState(50);
  const [scrapeDepth, setScrapeDepth] = useState(3);
  const [editingContext, setEditingContext] = useState(false);
  const [contextForm, setContextForm] = useState({ clientProblems: "", competitorAnalysis: "", projectRequirements: "", clientNotes: "" });
  const [savingContext, setSavingContext] = useState(false);
  const [expandedContextSections, setExpandedContextSections] = useState<Set<string>>(new Set());
  const [activeContextTab, setActiveContextTab] = useState<string | null>(null);
  const [addingCompetitor, setAddingCompetitor] = useState(false);
  const [competitorForm, setCompetitorForm] = useState({ name: "", url: "", type: "competitor" as CompetitorType, preferredFeature: "", preferredFeatureUrl: "", notes: "", screenshotLabel: null as ScreenshotLabel | null });
  const [savingCompetitor, setSavingCompetitor] = useState(false);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [capturingCompetitorId, setCapturingCompetitorId] = useState<string | null>(null);
  const [viewingCompetitor, setViewingCompetitor] = useState<Competitor | null>(null);
  const [editingCompetitor, setEditingCompetitor] = useState(false);
  const [competitorEditForm, setCompetitorEditForm] = useState({ name: "", url: "", type: "competitor" as CompetitorType, preferredFeature: "", preferredFeatureUrl: "", notes: "", screenshotLabel: null as ScreenshotLabel | null });
  const [savingCompetitorEdit, setSavingCompetitorEdit] = useState(false);
  const [editReferenceImages, setEditReferenceImages] = useState<ReferenceImage[]>([]);
  const [viewingScreenshot, setViewingScreenshot] = useState<{ url: string; title: string } | null>(null);
  const [showMockupForm, setShowMockupForm] = useState(false);
  const [mockupStyle, setMockupStyle] = useState("Modern Minimal");
  const [mockupPageType, setMockupPageType] = useState("Homepage");
  const [mockupAspectRatio, setMockupAspectRatio] = useState("9:16");
  const [mockupCustomPrompt, setMockupCustomPrompt] = useState("");
  const [generatingPrompt, setGeneratingPrompt] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [editedPrompt, setEditedPrompt] = useState("");
  const [mockupRefImages, setMockupRefImages] = useState<string[]>([]);
  const [primaryRefIndex, setPrimaryRefIndex] = useState<number | null>(null);
  const [mockupFormTouched, setMockupFormTouched] = useState(false);
  const [mockupStyleRef, setMockupStyleRef] = useState("");
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [promptName, setPromptName] = useState("");
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [savedPromptSuccess, setSavedPromptSuccess] = useState(false);
  const [showLoadPrompt, setShowLoadPrompt] = useState(false);
  const [renamingPromptId, setRenamingPromptId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [viewingPromptLog, setViewingPromptLog] = useState<Mockup | null>(null);
  const [extractingProducts, setExtractingProducts] = useState<string | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productView, setProductView] = useState<"grid" | "tree">("grid");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [detectingPlatform, setDetectingPlatform] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [selectedProductImageUrls, setSelectedProductImageUrls] = useState<string[]>([]);
  const [archivingPageId, setArchivingPageId] = useState<string | null>(null);

  async function handleArchivePage(pageId: string, archived: number) {
    setArchivingPageId(pageId);
    try {
      const res = await fetch(`/api/pages/${pageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived }),
      });
      if (!res.ok) throw new Error("Failed to update page");
      await fetchProject();
      toast.success(archived ? "Page archived" : "Page restored");
    } catch {
      toast.error("Failed to update page");
    } finally {
      setArchivingPageId(null);
    }
  }

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
        body: JSON.stringify({ projectId: id, limit: scrapeLimit, maxDepth: scrapeDepth }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to start scraping");
      }

      toast.info("Crawl started...");

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
          toast.success(`Scraping complete! ${statusResult.completed} pages found`);
          return;
        }

        if (statusResult.status === "error" || statusResult.status === "failed" || statusResult.status === "cancelled") {
          throw new Error(statusResult.error || `Scraping ${statusResult.status}`);
        }
      };

      await pollStatus();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Scraping failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setScraping(false);
      setScrapeProgress(null);
    }
  }

  async function startAnalysis() {
    setError(null);
    setAnalyzing(true);
    toast.info("Running AI analysis...");

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
      toast.success("Analysis complete!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Analysis failed";
      setError(msg);
      toast.error(msg);
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
      toast.success("Page added successfully");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to scrape URL";
      setError(msg);
      toast.error(msg);
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
      toast.success("Client context saved");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save context";
      setError(msg);
      toast.error(msg);
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
          screenshotLabel: competitorForm.screenshotLabel,
          notes: competitorForm.notes.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to add competitor");
      }

      setCompetitorForm({ name: "", url: "", type: "competitor", preferredFeature: "", preferredFeatureUrl: "", notes: "", screenshotLabel: null });
      setReferenceImages([]);
      setAddingCompetitor(false);
      await fetchProject();
      toast.success("Competitor added");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to add competitor";
      setError(msg);
      toast.error(msg);
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
      toast.success("Screenshot recaptured");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to recapture screenshot";
      setError(msg);
      toast.error(msg);
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
      toast.success("Competitor deleted");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete competitor";
      setError(msg);
      toast.error(msg);
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
      screenshotLabel: viewingCompetitor.screenshotLabel || null,
    });
    setEditReferenceImages(normalizeReferenceImages(viewingCompetitor.referenceImages));
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
          screenshotLabel: competitorEditForm.screenshotLabel,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save changes");
      }

      setViewingCompetitor(result.competitor);
      setEditingCompetitor(false);
      await fetchProject();
      toast.success("Competitor updated");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save changes";
      setError(msg);
      toast.error(msg);
    } finally {
      setSavingCompetitorEdit(false);
    }
  }

  async function handleGeneratePrompt() {
    setError(null);
    setGeneratingPrompt(true);

    try {
      const response = await fetch("/api/mockups/generate-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: id,
          style: mockupStyle,
          pageType: mockupPageType,
          aspectRatio: mockupAspectRatio,
          customInstructions: mockupCustomPrompt.trim() || undefined,
          selectedProductIds: selectedProductIds.length > 0 ? selectedProductIds : undefined,
          hasLogo: !!data?.project.logo,
          selectedProductImageCount: selectedProductImageUrls.length,
          hasPrimaryReference: primaryRefIndex !== null,
          referenceImageCount: mockupRefImages.length,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to generate prompt");
      }

      setGeneratedPrompt(result.prompt);
      setEditedPrompt(result.prompt);
      setShowMockupForm(false);
      toast.success("Prompt generated");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate prompt";
      setError(msg);
      toast.error(msg);
    } finally {
      setGeneratingPrompt(false);
    }
  }

  async function handleGenerateImage() {
    setError(null);
    setGeneratingImage(true);

    try {
      // Append style references to the prompt if provided
      let finalPrompt = editedPrompt;
      if (mockupStyleRef.trim()) {
        finalPrompt += `\n\nAdditional style references:\n${mockupStyleRef.trim()}`;
      }

      const response = await fetch("/api/mockups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: id,
          prompt: finalPrompt,
          label: mockupPageType,
          style: mockupStyle,
          extraReferenceImages: mockupRefImages.length > 0 ? mockupRefImages : undefined,
          primaryReferenceImageIndex: mockupRefImages.length > 0 && primaryRefIndex !== null ? primaryRefIndex : undefined,
          selectedProductImageUrls: selectedProductImageUrls.length > 0 ? selectedProductImageUrls : undefined,
          aspectRatio: mockupAspectRatio,
          originalPrompt: generatedPrompt || undefined,
          customInstructions: mockupCustomPrompt.trim() || undefined,
          styleRef: mockupStyleRef.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to generate mockup");
      }

      setGeneratedPrompt("");
      setEditedPrompt("");
      setMockupCustomPrompt("");
      setMockupRefImages([]);
      setPrimaryRefIndex(null);
      setMockupFormTouched(false);
      setMockupStyleRef("");
      setSelectedProductImageUrls([]);
      await fetchProject();
      toast.success("Mockup generated!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate mockup";
      setError(msg);
      toast.error(msg);
    } finally {
      setGeneratingImage(false);
    }
  }

  async function deleteMockup(mockupId: string) {
    setError(null);

    try {
      const response = await fetch(`/api/mockups/${mockupId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to delete mockup");
      }

      await fetchProject();
      toast.success("Mockup deleted");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete mockup";
      setError(msg);
      toast.error(msg);
    }
  }

  async function handleExtractProducts(pageId: string) {
    setExtractingProducts(pageId);
    try {
      const response = await fetch("/api/products/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to extract products");
      }

      if (result.extractedCount === 0) {
        toast.info("No products found on this page");
      } else {
        toast.success(`Extracted ${result.extractedCount} product${result.extractedCount !== 1 ? "s" : ""}`);
      }
      await fetchProject();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to extract products";
      toast.error(msg);
    } finally {
      setExtractingProducts(null);
    }
  }

  async function handleDeleteProduct(productId: string) {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to delete product");
      }

      setSelectedProductIds((prev) => prev.filter((id) => id !== productId));
      await fetchProject();
      toast.success("Product deleted");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete product";
      toast.error(msg);
    }
  }

  async function handleCopy(text: string, field: string) {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedField(null), 2000);
  }

  async function handleDetectPlatform() {
    setDetectingPlatform(true);
    try {
      const response = await fetch(`/api/projects/${id}/detect-platform`, {
        method: "POST",
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to detect platform");
      }
      toast.success(
        result.platformInfo.platform !== "unknown"
          ? `Detected platform: ${result.platformInfo.platform}`
          : "Could not determine platform"
      );
      await fetchProject();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to detect platform";
      toast.error(msg);
    } finally {
      setDetectingPlatform(false);
    }
  }

  function toggleProductSelection(productId: string) {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  }

  function toggleProductImageUrl(url: string) {
    setSelectedProductImageUrls((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
  }

  async function handleLogoUpload(file: File) {
    setUploadingLogo(true);
    try {
      const reader = new FileReader();
      const dataUri = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logo: dataUri }),
      });

      if (!response.ok) throw new Error("Failed to upload logo");
      await fetchProject();
      toast.success("Logo uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload logo");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleLogoRemove() {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logo: null }),
      });

      if (!response.ok) throw new Error("Failed to remove logo");
      await fetchProject();
      toast.success("Logo removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove logo");
    }
  }

  async function handleSavePrompt() {
    if (!promptName.trim() || !editedPrompt.trim()) return;
    setSavingPrompt(true);
    setSavedPromptSuccess(false);

    try {
      const response = await fetch("/api/saved-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: id,
          name: promptName.trim(),
          prompt: editedPrompt,
          style: mockupStyle || undefined,
          pageType: mockupPageType || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save prompt");
      }

      setPromptName("");
      setShowSavePrompt(false);
      setSavedPromptSuccess(true);
      setTimeout(() => setSavedPromptSuccess(false), 2000);
      await fetchProject();
      toast.success("Prompt saved");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save prompt";
      setError(msg);
      toast.error(msg);
    } finally {
      setSavingPrompt(false);
    }
  }

  function loadSavedPrompt(sp: SavedPrompt) {
    setEditedPrompt(sp.prompt);
    if (sp.style) setMockupStyle(sp.style);
    if (sp.pageType) setMockupPageType(sp.pageType);
    setShowLoadPrompt(false);
    // Make sure we're in the prompt review step
    if (!generatedPrompt) {
      setGeneratedPrompt(sp.prompt);
    }
  }

  function loadPromptFromMockup(mockup: Mockup) {
    setEditedPrompt(mockup.prompt);
    if (mockup.style) setMockupStyle(mockup.style);
    if (mockup.label) setMockupPageType(mockup.label);
    setShowLoadPrompt(false);
    if (!generatedPrompt) {
      setGeneratedPrompt(mockup.prompt);
    }
  }

  async function renameSavedPrompt(promptId: string) {
    if (!renameValue.trim()) return;

    try {
      const response = await fetch(`/api/saved-prompts/${promptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameValue.trim() }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to rename prompt");
      }

      setRenamingPromptId(null);
      setRenameValue("");
      await fetchProject();
      toast.success("Prompt renamed");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to rename prompt";
      setError(msg);
      toast.error(msg);
    }
  }

  async function deleteSavedPrompt(promptId: string) {
    try {
      const response = await fetch(`/api/saved-prompts/${promptId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to delete prompt");
      }

      await fetchProject();
      toast.success("Prompt deleted");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete prompt";
      setError(msg);
      toast.error(msg);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <SpinnerGap className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <Alert variant="destructive">
        <WarningCircle className="h-4 w-4" />
        <AlertDescription>Project not found</AlertDescription>
      </Alert>
    );
  }

  const { project, pages, analyses, competitors, mockups, savedPrompts, products } = data;

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

  const archivedCount = pages.filter((p) => p.archived === 1).length;
  const visiblePages = sortedPages.filter((p) => p.archived !== 1);

  const hasScrapedData = pages.length > 0;
  const hasAnalyses = analyses.length > 0;

  // Get homepage metadata for client information
  const homePage = sortedPages[0] || null;
  const homeMeta = (homePage?.metadata as Record<string, unknown> | null) || null;

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
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium">Type</label>
                      <div className="flex items-center rounded-lg border bg-muted/50 p-1 gap-1 w-fit">
                        <button
                          type="button"
                          onClick={() => setCompetitorEditForm({ ...competitorEditForm, type: "competitor" })}
                          disabled={savingCompetitorEdit}
                          className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 border border-transparent ${
                            competitorEditForm.type === "competitor"
                              ? "bg-background border-border text-foreground shadow-sm"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <Crosshair className={`h-3.5 w-3.5 mr-1.5 ${competitorEditForm.type === "competitor" ? "text-foreground" : ""}`} />
                          Competitor
                        </button>
                        <button
                          type="button"
                          onClick={() => setCompetitorEditForm({ ...competitorEditForm, type: "inspiration" })}
                          disabled={savingCompetitorEdit}
                          className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 border border-transparent ${
                            competitorEditForm.type === "inspiration"
                              ? "bg-violet-50 border-violet-200 text-violet-900 shadow-sm"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <Sparkle className={`h-3.5 w-3.5 mr-1.5 ${competitorEditForm.type === "inspiration" ? "text-violet-600" : ""}`} />
                          Inspiration
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium">Screenshot Quality</label>
                      <div className="flex items-center rounded-lg border bg-muted/50 p-1 gap-1 w-fit">
                        <button
                          type="button"
                          onClick={() => setCompetitorEditForm({ ...competitorEditForm, screenshotLabel: null })}
                          disabled={savingCompetitorEdit}
                          className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 border border-transparent ${
                            competitorEditForm.screenshotLabel === null
                              ? "bg-background border-border text-foreground shadow-sm"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <Circle className={`h-3.5 w-3.5 mr-1.5 ${competitorEditForm.screenshotLabel === null ? "text-muted-foreground" : ""}`} />
                          Unlabeled
                        </button>
                        <button
                          type="button"
                          onClick={() => setCompetitorEditForm({ ...competitorEditForm, screenshotLabel: "good" })}
                          disabled={savingCompetitorEdit}
                          className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 border border-transparent ${
                            competitorEditForm.screenshotLabel === "good"
                              ? "bg-emerald-50 border-emerald-200 text-emerald-900 shadow-sm"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <ThumbsUp className={`h-3.5 w-3.5 mr-1.5 ${competitorEditForm.screenshotLabel === "good" ? "text-emerald-600" : ""}`} />
                          Good Inspiration
                        </button>
                        <button
                          type="button"
                          onClick={() => setCompetitorEditForm({ ...competitorEditForm, screenshotLabel: "bad" })}
                          disabled={savingCompetitorEdit}
                          className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 border border-transparent ${
                            competitorEditForm.screenshotLabel === "bad"
                              ? "bg-rose-50 border-rose-200 text-rose-900 shadow-sm"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <ThumbsDown className={`h-3.5 w-3.5 mr-1.5 ${competitorEditForm.screenshotLabel === "bad" ? "text-rose-600" : ""}`} />
                          Bad Example
                        </button>
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
                        <div className="flex flex-wrap gap-3">
                          {editReferenceImages.map((img, i) => (
                            <div key={i} className="relative group/thumb flex flex-col items-center gap-1">
                              <div className="relative">
                                <img
                                  src={img.url}
                                  alt={`Reference ${i + 1}`}
                                  className={`rounded-md border-2 h-20 w-20 object-cover ${img.tag === "emulate" ? "border-green-500" : img.tag === "avoid" ? "border-red-500" : "border-border"}`}
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
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  className={`px-1.5 py-0.5 text-[10px] rounded font-medium uppercase font-[family-name:var(--font-ibm-plex-mono)] transition-colors ${img.tag === "emulate" ? "bg-green-100 text-green-700 ring-1 ring-green-400" : "bg-muted text-muted-foreground hover:bg-green-50 hover:text-green-700"}`}
                                  onClick={() =>
                                    setEditReferenceImages((prev) => prev.map((r, j) => j === i ? { ...r, tag: r.tag === "emulate" ? null : "emulate" } : r))
                                  }
                                  disabled={savingCompetitorEdit}
                                >
                                  Emulate
                                </button>
                                <button
                                  type="button"
                                  className={`px-1.5 py-0.5 text-[10px] rounded font-medium uppercase font-[family-name:var(--font-ibm-plex-mono)] transition-colors ${img.tag === "avoid" ? "bg-red-100 text-red-700 ring-1 ring-red-400" : "bg-muted text-muted-foreground hover:bg-red-50 hover:text-red-700"}`}
                                  onClick={() =>
                                    setEditReferenceImages((prev) => prev.map((r, j) => j === i ? { ...r, tag: r.tag === "avoid" ? null : "avoid" } : r))
                                  }
                                  disabled={savingCompetitorEdit}
                                >
                                  Avoid
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <label className="flex items-center gap-2 px-3 py-2 rounded-md border text-sm cursor-pointer hover:bg-muted/50 transition-colors w-fit">
                        <UploadSimple className="h-4 w-4 text-muted-foreground" />
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
                                setEditReferenceImages((prev) => [...prev, { url: reader.result as string, tag: null }]);
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
                        <SpinnerGap className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <FloppyDisk className="h-4 w-4 mr-2" />
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
                        {viewingCompetitor.screenshotLabel === "good" && (
                          <Badge className="bg-green-100 text-green-700 border-green-300" variant="outline">Good Inspiration</Badge>
                        )}
                        {viewingCompetitor.screenshotLabel === "bad" && (
                          <Badge className="bg-red-100 text-red-700 border-red-300" variant="outline">Bad Example</Badge>
                        )}
                      </div>
                      <a
                        href={viewingCompetitor.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {viewingCompetitor.url}
                        <ArrowSquareOut className="h-3 w-3" />
                      </a>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={startEditingCompetitor}
                        title="Edit"
                      >
                        <PencilSimple className="h-4 w-4" />
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
                          <ArrowSquareOut className="h-3 w-3" />
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
                      <div className="flex flex-wrap gap-3">
                        {normalizeReferenceImages(viewingCompetitor.referenceImages).map((img, i) => (
                          <div key={i} className="flex flex-col items-center gap-1">
                            <button
                              type="button"
                              className="group/ref cursor-pointer"
                              onClick={() =>
                                setViewingScreenshot({
                                  url: img.url,
                                  title: `${viewingCompetitor.name} — Reference ${i + 1}${img.tag ? ` (${img.tag})` : ""}`,
                                })
                              }
                            >
                              <img
                                src={img.url}
                                alt={`Reference ${i + 1}`}
                                className={`rounded-md border-2 h-24 w-24 object-cover group-hover/ref:ring-2 group-hover/ref:ring-primary transition-all ${img.tag === "emulate" ? "border-green-500" : img.tag === "avoid" ? "border-red-500" : "border-border"}`}
                              />
                            </button>
                            {img.tag && (
                              <span className={`text-[10px] font-medium uppercase font-[family-name:var(--font-ibm-plex-mono)] px-1.5 py-0.5 rounded ${img.tag === "emulate" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                {img.tag === "emulate" ? "Emulate" : "Avoid"}
                              </span>
                            )}
                          </div>
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
                        <SpinnerGap className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <ArrowsClockwise className="h-4 w-4 mr-2" />
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
                      <Trash className="h-4 w-4 mr-2" />
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
                <MapTrifold className="h-4 w-4 mr-2" />
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
          <WarningCircle className="h-5 w-5" />
          <AlertDescription className="font-medium">{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Project Overview</CardTitle>
              {/* Logo upload/preview */}
              <div>
                {project.logo ? (
                  <div className="group relative">
                    <img
                      src={project.logo}
                      alt="Brand logo"
                      className="h-10 w-auto max-w-[120px] object-contain rounded-lg bg-muted p-1"
                    />
                    <div className="absolute inset-0 bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                      <label className="cursor-pointer p-1 hover:bg-white/20 rounded" title="Replace logo">
                        <ArrowsClockwise className="h-3.5 w-3.5 text-white" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleLogoUpload(file);
                            e.target.value = "";
                          }}
                        />
                      </label>
                      <button
                        onClick={handleLogoRemove}
                        className="p-1 hover:bg-white/20 rounded"
                        title="Remove logo"
                      >
                        <X className="h-3.5 w-3.5 text-white" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-dashed border-muted-foreground/40 hover:border-muted-foreground/70 hover:bg-muted/50 transition-colors text-xs text-muted-foreground">
                    {uploadingLogo ? (
                      <SpinnerGap className="h-4 w-4 animate-spin" />
                    ) : (
                      <UploadSimple className="h-3.5 w-3.5" />
                    )}
                    {uploadingLogo ? "Uploading..." : "Logo"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingLogo}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoUpload(file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
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
                <ArrowSquareOut className="h-3 w-3" />
              </a>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              <CalendarBlank className="h-3.5 w-3.5" />
              <span>Created {formatDate(project.createdAt)}</span>
              <span className="h-3 border-l-2 border-dotted border-primary/30" />
              <ClockCounterClockwise className="h-3.5 w-3.5" />
              <span>Last updated {formatDate(project.updatedAt)}</span>
            </div>

            {/* Client Information */}
            {homeMeta && (!!homeMeta.title || !!homeMeta.description || !!homeMeta.language || !!homeMeta.ogImage) && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Buildings className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Client Information</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    {!!homeMeta.title && (
                      <div>
                        <span className="text-muted-foreground">Site Title</span>
                        <p>{String(homeMeta.title)}</p>
                      </div>
                    )}
                    {!!homeMeta.description && (
                      <div>
                        <span className="text-muted-foreground">Description</span>
                        <p>{String(homeMeta.description)}</p>
                      </div>
                    )}
                    {!!homeMeta.language && (
                      <div>
                        <span className="text-muted-foreground">Language</span>
                        <div><Badge variant="secondary">{String(homeMeta.language)}</Badge></div>
                      </div>
                    )}
                    {!!homeMeta.ogImage && (
                      <div>
                        <span className="text-muted-foreground">OG Image</span>
                        <img
                          src={String(homeMeta.ogImage)}
                          alt="Open Graph"
                          className="mt-1 w-full max-w-xs rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Page limit</label>
                  <select
                    value={scrapeLimit}
                    onChange={(e) => setScrapeLimit(Number(e.target.value))}
                    disabled={scraping || analyzing || scrapingSingle}
                    className="w-full h-9 rounded-[8px] border border-input bg-background px-2 pr-8 text-sm"
                  >
                    <option value={10}>10 pages</option>
                    <option value={25}>25 pages</option>
                    <option value={50}>50 pages</option>
                    <option value={100}>100 pages</option>
                    <option value={200}>200 pages</option>
                    <option value={500}>500 pages</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Crawl depth</label>
                  <select
                    value={scrapeDepth}
                    onChange={(e) => setScrapeDepth(Number(e.target.value))}
                    disabled={scraping || analyzing || scrapingSingle}
                    className="w-full h-9 rounded-[8px] border border-input bg-background px-2 pr-8 text-sm"
                  >
                    <option value={2}>2 levels</option>
                    <option value={3}>3 levels</option>
                    <option value={4}>4 levels</option>
                    <option value={5}>5 levels</option>
                  </select>
                </div>
              </div>
              <Button
                onClick={startScraping}
                disabled={scraping || analyzing || scrapingSingle}
                className="w-full"
                variant={hasScrapedData ? "outline" : "default"}
              >
                {scraping ? (
                  <SpinnerGap className="h-4 w-4 mr-2 animate-spin" />
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
                  Crawls up to {scrapeLimit} pages, {scrapeDepth} levels deep
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
                    <SpinnerGap className="h-4 w-4 animate-spin" />
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
              {analyzing ? (
                <>
                  <Button disabled className="w-full">
                    <SpinnerGap className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Analyzing content with AI... This may take a minute.
                  </p>
                </>
              ) : !hasScrapedData ? (
                <p className="text-xs text-muted-foreground">
                  Scrape the website first to enable analysis
                </p>
              ) : hasAnalyses ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span>Analysis complete</span>
                </div>
              ) : (
                <Button
                  onClick={startAnalysis}
                  disabled={scraping || scrapingSingle}
                  className="w-full"
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Run AI Analysis
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Detection */}
      {!project.platformInfo ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Platform Detection
                </CardTitle>
                <CardDescription>
                  Detect the platform used by this website
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={handleDetectPlatform}
                disabled={!hasScrapedData || detectingPlatform}
              >
                {detectingPlatform ? (
                  <SpinnerGap className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Monitor className="h-4 w-4 mr-2" />
                )}
                Detect Platform
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {hasScrapedData
                ? "Click to analyze scraped pages and detect the website platform."
                : "Scrape pages first to enable platform detection."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Platform Detection
                </CardTitle>
                <CardDescription>
                  Detected during website scraping
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={
                  project.platformInfo.confidence === "high" ? "default" :
                  project.platformInfo.confidence === "medium" ? "secondary" : "outline"
                }>
                  {project.platformInfo.confidence} confidence
                </Badge>
                <Badge variant="outline">
                  {project.platformInfo.platform}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleDetectPlatform}
                  disabled={detectingPlatform}
                  title="Re-detect platform"
                >
                  {detectingPlatform ? (
                    <SpinnerGap className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowsClockwise className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Shopify details */}
            {project.platformInfo.platform === "shopify" && project.platformInfo.shopify && (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Theme Name</p>
                    <p className="font-medium">{project.platformInfo.shopify.themeName || "Unknown"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Theme ID</p>
                    <p className="font-medium">{project.platformInfo.shopify.themeId || "Unknown"}</p>
                  </div>
                </div>
                {project.platformInfo.shopify.templates.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Templates Detected</p>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="text-left px-3 py-2 font-medium">Template</th>
                            <th className="text-left px-3 py-2 font-medium">Pages</th>
                            <th className="text-left px-3 py-2 font-medium">Sample URLs</th>
                          </tr>
                        </thead>
                        <tbody>
                          {project.platformInfo.shopify.templates.map((tmpl) => (
                            <tr key={tmpl.name} className="border-t">
                              <td className="px-3 py-2">
                                <Badge variant="outline">{tmpl.name}</Badge>
                              </td>
                              <td className="px-3 py-2">{tmpl.count}</td>
                              <td className="px-3 py-2">
                                <div className="space-y-0.5">
                                  {tmpl.pages.slice(0, 3).map((url) => (
                                    <a
                                      key={url}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block text-xs text-blue-600 hover:underline truncate max-w-[300px]"
                                    >
                                      {new URL(url).pathname}
                                    </a>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* WordPress details */}
            {project.platformInfo.platform === "wordpress" && project.platformInfo.wordpress && (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Theme Name</p>
                  <p className="font-medium">{project.platformInfo.wordpress.themeName || "Unknown"}</p>
                </div>
                {project.platformInfo.wordpress.plugins.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Detected Plugins</p>
                    <div className="flex flex-wrap gap-1.5">
                      {project.platformInfo.wordpress.plugins.map((plugin) => (
                        <Badge key={plugin} variant="outline">{plugin}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Detection signals */}
            {project.platformInfo.signals.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Detection Signals</p>
                <ul className="space-y-1">
                  {project.platformInfo.signals.map((signal, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />
                      {signal}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Detected on {formatDate(project.platformInfo.detectedAt)}
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="lg:col-span-3">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Client Context</CardTitle>
            {!editingContext && (
              <Button variant="ghost" size="icon" onClick={startEditingContext}>
                <PencilSimple className="h-4 w-4" />
              </Button>
            )}
          </div>
          <CardDescription>
            Problems and goals inform AI analysis recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {editingContext ? (
            (() => {
              const editTabs = [
                { key: "problems", label: "Problems", icon: Chat, color: "border-l-red-500", iconColor: "text-red-500 dark:text-red-400", field: "clientProblems" as const, placeholder: "Describe current challenges..." },
                { key: "competitor", label: "Competitors", icon: Crosshair, color: "border-l-blue-800 dark:border-l-blue-400", iconColor: "text-blue-800 dark:text-blue-400", field: "competitorAnalysis" as const, placeholder: "Competitor insights, desired features..." },
                { key: "requirements", label: "Requirements", icon: ClipboardText, color: "border-l-green-600 dark:border-l-green-400", iconColor: "text-green-600 dark:text-green-400", field: "projectRequirements" as const, placeholder: "What the new project needs..." },
                { key: "notes", label: "Notes", icon: Note, color: "border-l-orange-500", iconColor: "text-orange-500 dark:text-orange-400", field: "clientNotes" as const, placeholder: "Other notes or context..." },
              ];
              const currentEditKey = activeContextTab || editTabs[0].key;
              const activeEditTab = editTabs.find(t => t.key === currentEditKey) || editTabs[0];

              return (
                <div className="space-y-4">
                  <div className="flex border rounded-xl overflow-hidden min-h-[300px]">
                    <div className="flex flex-col shrink-0 border-r divide-y bg-background">
                      {editTabs.map((tab) => {
                        const isActive = activeEditTab.key === tab.key;
                        return (
                          <button
                            key={tab.key}
                            onClick={() => setActiveContextTab(tab.key)}
                            className={`flex items-center gap-3 text-left text-sm transition-colors px-4 py-3 ${
                              isActive
                                ? `border-l-[3px] ${tab.color} font-medium text-foreground`
                                : "border-l-[3px] border-l-transparent font-normal text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <tab.icon
                              className={`h-4 w-4 shrink-0 ${isActive ? tab.iconColor : "text-muted-foreground/50"}`}
                            />
                            <span className="whitespace-nowrap">{tab.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex-1 bg-muted/20 dark:bg-muted/10">
                      <MarkdownEditor
                        key={activeEditTab.key}
                        placeholder={activeEditTab.placeholder}
                        value={contextForm[activeEditTab.field]}
                        onChange={(md) =>
                          setContextForm({ ...contextForm, [activeEditTab.field]: md })
                        }
                        disabled={savingContext}
                        chromeless
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={saveContext} disabled={savingContext} size="sm">
                      {savingContext ? (
                        <SpinnerGap className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <FloppyDisk className="h-4 w-4 mr-2" />
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
              );
            })()
          ) : project.clientProblems || project.competitorAnalysis || project.projectRequirements || project.clientNotes ? (
            (() => {
              const contextTabs = [
                project.clientProblems ? { key: "problems", label: "Problems", icon: Chat, color: "border-l-red-500", iconColor: "text-red-500 dark:text-red-400", content: project.clientProblems } : null,
                project.competitorAnalysis ? { key: "competitor", label: "Competitors", icon: Crosshair, color: "border-l-blue-800 dark:border-l-blue-400", iconColor: "text-blue-800 dark:text-blue-400", content: project.competitorAnalysis } : null,
                project.projectRequirements ? { key: "requirements", label: "Requirements", icon: ClipboardText, color: "border-l-green-600 dark:border-l-green-400", iconColor: "text-green-600 dark:text-green-400", content: project.projectRequirements } : null,
                project.clientNotes ? { key: "notes", label: "Notes", icon: Note, color: "border-l-orange-500", iconColor: "text-orange-500 dark:text-orange-400", content: project.clientNotes } : null,
              ].filter(Boolean) as { key: string; label: string; icon: React.ElementType; color: string; iconColor: string; content: string }[];

              const currentActiveKey = activeContextTab || contextTabs[0]?.key;
              const activeTab = contextTabs.find(t => t.key === currentActiveKey) || contextTabs[0];

              return (
                <div className="flex border rounded-xl overflow-hidden min-h-[200px]">
                  <div className="flex flex-col shrink-0 border-r divide-y bg-background">
                    {contextTabs.map((tab) => {
                      const isActive = activeTab.key === tab.key;
                      return (
                        <button
                          key={tab.key}
                          onClick={() => setActiveContextTab(tab.key)}
                          className={`flex items-center gap-3 text-left text-sm transition-colors px-4 py-3 ${
                            isActive
                              ? `border-l-[3px] ${tab.color} font-medium text-foreground`
                              : "border-l-[3px] border-l-transparent font-normal text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <tab.icon
                            className={`h-4 w-4 shrink-0 ${isActive ? tab.iconColor : "text-muted-foreground/50"}`}
                          />
                          <span className="whitespace-nowrap">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex-1 bg-muted/20 dark:bg-muted/10 overflow-auto relative">
                    <div className="absolute top-2 right-2 z-10">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 bg-background/80 backdrop-blur-sm hover:bg-background"
                        onClick={() => {
                          navigator.clipboard.writeText(activeTab.content);
                          setCopiedField(`context-${activeTab.key}`);
                          toast.success("Copied to clipboard");
                          setTimeout(() => setCopiedField(null), 2000);
                        }}
                        title="Copy markdown"
                      >
                        {copiedField === `context-${activeTab.key}` ? (
                          <Check className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                    <div className="p-6 text-sm text-foreground/90 leading-relaxed prose prose-sm max-w-none dark:prose-invert">
                      <MarkdownViewer key={activeTab.key} content={activeTab.content} />
                    </div>
                  </div>
                </div>
              );
            })()
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

      {analyses.length > 0 && (() => {
        const latestAnalysis = new Date(Math.max(...analyses.map(a => new Date(a.createdAt).getTime())));
        const analysisStale = project.contextUpdatedAt
          && new Date(project.contextUpdatedAt) > latestAnalysis;
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Completed Analyses</CardTitle>
                <Button
                  onClick={startAnalysis}
                  disabled={analyzing || scraping || scrapingSingle}
                  size="sm"
                >
                  {analyzing ? (
                    <SpinnerGap className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Brain className="h-4 w-4 mr-2" />
                  )}
                  Re-analyze
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {analysisStale && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3 text-sm text-amber-800 dark:text-amber-200">
                  <Warning className="h-4 w-4 shrink-0" />
                  Client context has been updated since the last analysis.
                </div>
              )}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {analyses.map((analysis) => {
                  const colors: Record<string, string> = {
                    marketing: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300",
                    techstack: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300",
                    architecture: "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300",
                    performance: "bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300",
                    recommendations: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300",
                  };
                  return (
                    <Link
                      key={analysis.id}
                      href={`/projects/${id}/analysis?tab=${analysis.type}`}
                      className={`group flex flex-col items-center gap-3 rounded-xl p-5 text-center transition-all hover:opacity-80 ${colors[analysis.type] || "bg-muted"}`}
                    >
                      <AnalysisIcon type={analysis.type} />
                      <span className="text-sm font-semibold capitalize">{analysis.type === "techstack" ? "Tech Stack" : analysis.type}</span>
                    </Link>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Last analyzed {formatDate(latestAnalysis)}
              </p>
            </CardContent>
          </Card>
        );
      })()}

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
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Type</label>
                <div className="flex items-center rounded-lg border bg-muted/50 p-1 gap-1 w-fit">
                  <button
                    type="button"
                    onClick={() => setCompetitorForm({ ...competitorForm, type: "competitor" })}
                    disabled={savingCompetitor}
                    className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 border border-transparent ${
                      competitorForm.type === "competitor"
                        ? "bg-background border-border text-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Crosshair className={`h-3.5 w-3.5 mr-1.5 ${competitorForm.type === "competitor" ? "text-foreground" : ""}`} />
                    Competitor
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompetitorForm({ ...competitorForm, type: "inspiration" })}
                    disabled={savingCompetitor}
                    className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 border border-transparent ${
                      competitorForm.type === "inspiration"
                        ? "bg-violet-50 border-violet-200 text-violet-900 shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Sparkle className={`h-3.5 w-3.5 mr-1.5 ${competitorForm.type === "inspiration" ? "text-violet-600" : ""}`} />
                    Inspiration
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Screenshot Quality (optional)</label>
                <div className="flex items-center rounded-lg border bg-muted/50 p-1 gap-1 w-fit">
                  <button
                    type="button"
                    onClick={() => setCompetitorForm({ ...competitorForm, screenshotLabel: null })}
                    disabled={savingCompetitor}
                    className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 border border-transparent ${
                      competitorForm.screenshotLabel === null
                        ? "bg-background border-border text-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Circle className={`h-3.5 w-3.5 mr-1.5 ${competitorForm.screenshotLabel === null ? "text-muted-foreground" : ""}`} />
                    Unlabeled
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompetitorForm({ ...competitorForm, screenshotLabel: "good" })}
                    disabled={savingCompetitor}
                    className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 border border-transparent ${
                      competitorForm.screenshotLabel === "good"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-900 shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <ThumbsUp className={`h-3.5 w-3.5 mr-1.5 ${competitorForm.screenshotLabel === "good" ? "text-emerald-600" : ""}`} />
                    Good Inspiration
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompetitorForm({ ...competitorForm, screenshotLabel: "bad" })}
                    disabled={savingCompetitor}
                    className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 border border-transparent ${
                      competitorForm.screenshotLabel === "bad"
                        ? "bg-rose-50 border-rose-200 text-rose-900 shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <ThumbsDown className={`h-3.5 w-3.5 mr-1.5 ${competitorForm.screenshotLabel === "bad" ? "text-rose-600" : ""}`} />
                    Bad Example
                  </button>
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
                  <UploadSimple className="h-4 w-4 text-muted-foreground" />
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
                          setReferenceImages((prev) => [...prev, { url: reader.result as string, tag: null }]);
                        };
                        reader.readAsDataURL(file);
                      });
                      e.target.value = "";
                    }}
                  />
                </label>
                {referenceImages.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-2">
                    {referenceImages.map((img, i) => (
                      <div key={i} className="relative group/thumb flex flex-col items-center gap-1">
                        <div className="relative">
                          <img
                            src={img.url}
                            alt={`Reference ${i + 1}`}
                            className={`rounded-md border-2 h-20 w-20 object-cover ${img.tag === "emulate" ? "border-green-500" : img.tag === "avoid" ? "border-red-500" : "border-border"}`}
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
                        <div className="flex gap-1">
                          <button
                            type="button"
                            className={`px-1.5 py-0.5 text-[10px] rounded font-medium uppercase font-[family-name:var(--font-ibm-plex-mono)] transition-colors ${img.tag === "emulate" ? "bg-green-100 text-green-700 ring-1 ring-green-400" : "bg-muted text-muted-foreground hover:bg-green-50 hover:text-green-700"}`}
                            onClick={() =>
                              setReferenceImages((prev) => prev.map((r, j) => j === i ? { ...r, tag: r.tag === "emulate" ? null : "emulate" } : r))
                            }
                          >
                            Emulate
                          </button>
                          <button
                            type="button"
                            className={`px-1.5 py-0.5 text-[10px] rounded font-medium uppercase font-[family-name:var(--font-ibm-plex-mono)] transition-colors ${img.tag === "avoid" ? "bg-red-100 text-red-700 ring-1 ring-red-400" : "bg-muted text-muted-foreground hover:bg-red-50 hover:text-red-700"}`}
                            onClick={() =>
                              setReferenceImages((prev) => prev.map((r, j) => j === i ? { ...r, tag: r.tag === "avoid" ? null : "avoid" } : r))
                            }
                          >
                            Avoid
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Upload screenshots and tag each as &ldquo;Emulate&rdquo; (use as inspiration) or &ldquo;Avoid&rdquo; (things to stay away from)
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
                    <SpinnerGap className="h-4 w-4 mr-2 animate-spin" />
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
                    setCompetitorForm({ name: "", url: "", type: "competitor", preferredFeature: "", preferredFeatureUrl: "", notes: "", screenshotLabel: null });
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
                const normalizedRefs = normalizeReferenceImages(comp.referenceImages);
                const thumbSrc = normalizedRefs[0]?.url || comp.screenshot;
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
                      {comp.screenshotLabel === "good" && (
                        <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-300" variant="outline">Good</Badge>
                      )}
                      {comp.screenshotLabel === "bad" && (
                        <Badge className="text-[10px] px-1.5 py-0 bg-red-100 text-red-700 border-red-300" variant="outline">Bad</Badge>
                      )}
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

      {products.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Extracted Products
                </CardTitle>
                <CardDescription>
                  {products.length} product{products.length !== 1 ? "s" : ""} extracted from scraped pages
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-md border">
                  <button
                    type="button"
                    onClick={() => setProductView("grid")}
                    className={`p-1.5 rounded-l-md transition-colors ${productView === "grid" ? "bg-muted" : "hover:bg-muted/50"}`}
                    title="Grid view"
                  >
                    <GridFour className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductView("tree")}
                    className={`p-1.5 rounded-r-md transition-colors ${productView === "tree" ? "bg-muted" : "hover:bg-muted/50"}`}
                    title="Tree view"
                  >
                    <TreeStructure className="h-4 w-4" />
                  </button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const grouped: Record<string, Product[]> = {};
                    products.forEach((p) => {
                      const cat = p.category || "Uncategorized";
                      if (!grouped[cat]) grouped[cat] = [];
                      grouped[cat].push(p);
                    });
                    const exportData = {
                      projectName: project.name,
                      projectUrl: project.url,
                      exportedAt: new Date().toISOString(),
                      totalProducts: products.length,
                      categories: Object.entries(grouped).map(([name, prods]) => ({
                        name,
                        products: prods.map((p) => ({
                          name: p.name,
                          price: p.price,
                          currency: p.currency,
                          description: p.description,
                          brand: p.brand,
                          sku: p.sku,
                          availability: p.availability,
                          variants: p.variants,
                          specifications: p.specifications,
                          images: p.images,
                          category: p.category,
                        })),
                      })),
                    };
                    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${project.name}-products.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                >
                  <DownloadSimple className="h-4 w-4 mr-1" />
                  Export JSON
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {productView === "grid" ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="group relative flex flex-col rounded-lg border overflow-hidden hover:border-primary/50 hover:shadow-md transition-all p-3 space-y-2"
                  >
                    {product.images && product.images.length > 0 && (
                      <div className="relative aspect-video bg-muted overflow-hidden rounded-md">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover object-center"
                        />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm truncate">{product.name}</p>
                      {product.price && (
                        <p className="text-sm text-muted-foreground">{product.price}</p>
                      )}
                      {product.variants && product.variants.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {product.variants.length} variant{product.variants.length !== 1 ? "s" : ""}
                        </p>
                      )}
                      {product.brand && (
                        <p className="text-xs text-muted-foreground">{product.brand}</p>
                      )}
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        className="h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-destructive"
                        onClick={() => handleDeleteProduct(product.id)}
                        title="Delete product"
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {(() => {
                  const grouped: Record<string, Product[]> = {};
                  products.forEach((p) => {
                    const cat = p.category || "Uncategorized";
                    if (!grouped[cat]) grouped[cat] = [];
                    grouped[cat].push(p);
                  });
                  return Object.entries(grouped).map(([category, catProducts]) => {
                    const catExpanded = expandedCategories.has(category);
                    return (
                      <div key={category}>
                        <button
                          type="button"
                          className="flex items-center gap-2 w-full py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors text-left"
                          onClick={() => {
                            setExpandedCategories((prev) => {
                              const next = new Set(prev);
                              if (next.has(category)) next.delete(category);
                              else next.add(category);
                              return next;
                            });
                          }}
                        >
                          {catExpanded ? (
                            <CaretDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                          ) : (
                            <CaretRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                          )}
                          <Package className="h-4 w-4 shrink-0" />
                          <span className="font-medium text-sm">{category}</span>
                          <Badge variant="secondary" className="ml-auto text-xs">
                            {catProducts.length}
                          </Badge>
                        </button>
                        {catExpanded && (
                          <div className="ml-4 pl-2 border-l border-border">
                            {catProducts.map((product) => {
                              const prodExpanded = expandedProducts.has(product.id);
                              const hasVariants = product.variants && product.variants.length > 0;
                              const hasSpecs = product.specifications && Object.keys(product.specifications).length > 0;
                              const hasImages = product.images && product.images.length > 0;
                              const hasChildren = hasVariants || hasSpecs || hasImages;
                              return (
                                <div key={product.id}>
                                  <div className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors group">
                                    <button
                                      type="button"
                                      className={`shrink-0 ${hasChildren ? "cursor-pointer text-muted-foreground hover:text-foreground" : "invisible"}`}
                                      onClick={() => {
                                        if (!hasChildren) return;
                                        setExpandedProducts((prev) => {
                                          const next = new Set(prev);
                                          if (next.has(product.id)) next.delete(product.id);
                                          else next.add(product.id);
                                          return next;
                                        });
                                      }}
                                    >
                                      {prodExpanded ? (
                                        <CaretDown className="h-4 w-4" />
                                      ) : (
                                        <CaretRight className="h-4 w-4" />
                                      )}
                                    </button>
                                    <span className="text-sm truncate">{product.name}</span>
                                    {product.price && (
                                      <span className="text-sm text-muted-foreground shrink-0">
                                        &mdash; {product.price}
                                      </span>
                                    )}
                                    {product.brand && (
                                      <Badge variant="outline" className="ml-auto text-xs shrink-0">
                                        {product.brand}
                                      </Badge>
                                    )}
                                    <button
                                      type="button"
                                      className="h-6 w-6 rounded-full text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive flex items-center justify-center shrink-0"
                                      onClick={() => handleDeleteProduct(product.id)}
                                      title="Delete product"
                                    >
                                      <Trash className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                  {prodExpanded && hasChildren && (
                                    <div className="ml-4 pl-2 border-l border-border">
                                      {hasVariants && (() => {
                                        const secKey = `${product.id}-variants`;
                                        const secExpanded = expandedSections.has(secKey);
                                        return (
                                          <div>
                                            <button
                                              type="button"
                                              className="flex items-center gap-2 w-full py-1 px-2 rounded-md hover:bg-muted/50 transition-colors text-left"
                                              onClick={() => {
                                                setExpandedSections((prev) => {
                                                  const next = new Set(prev);
                                                  if (next.has(secKey)) next.delete(secKey);
                                                  else next.add(secKey);
                                                  return next;
                                                });
                                              }}
                                            >
                                              {secExpanded ? (
                                                <CaretDown className="h-3.5 w-3.5 text-muted-foreground" />
                                              ) : (
                                                <CaretRight className="h-3.5 w-3.5 text-muted-foreground" />
                                              )}
                                              <span className="text-xs font-medium text-muted-foreground">Variants</span>
                                            </button>
                                            {secExpanded && (
                                              <div className="ml-4 pl-2 border-l border-border">
                                                {product.variants!.map((v, i) => (
                                                  <div key={i} className="py-1 px-2 text-xs text-muted-foreground">
                                                    <span className="font-medium">{v.name}:</span> {v.options.join(", ")}
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })()}
                                      {hasSpecs && (() => {
                                        const secKey = `${product.id}-specs`;
                                        const secExpanded = expandedSections.has(secKey);
                                        return (
                                          <div>
                                            <button
                                              type="button"
                                              className="flex items-center gap-2 w-full py-1 px-2 rounded-md hover:bg-muted/50 transition-colors text-left"
                                              onClick={() => {
                                                setExpandedSections((prev) => {
                                                  const next = new Set(prev);
                                                  if (next.has(secKey)) next.delete(secKey);
                                                  else next.add(secKey);
                                                  return next;
                                                });
                                              }}
                                            >
                                              {secExpanded ? (
                                                <CaretDown className="h-3.5 w-3.5 text-muted-foreground" />
                                              ) : (
                                                <CaretRight className="h-3.5 w-3.5 text-muted-foreground" />
                                              )}
                                              <span className="text-xs font-medium text-muted-foreground">Specifications</span>
                                            </button>
                                            {secExpanded && (
                                              <div className="ml-4 pl-2 border-l border-border">
                                                {Object.entries(product.specifications!).map(([key, val]) => (
                                                  <div key={key} className="py-1 px-2 text-xs text-muted-foreground">
                                                    <span className="font-medium">{key}:</span> {val}
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })()}
                                      {hasImages && (() => {
                                        const secKey = `${product.id}-images`;
                                        const secExpanded = expandedSections.has(secKey);
                                        return (
                                          <div>
                                            <button
                                              type="button"
                                              className="flex items-center gap-2 w-full py-1 px-2 rounded-md hover:bg-muted/50 transition-colors text-left"
                                              onClick={() => {
                                                setExpandedSections((prev) => {
                                                  const next = new Set(prev);
                                                  if (next.has(secKey)) next.delete(secKey);
                                                  else next.add(secKey);
                                                  return next;
                                                });
                                              }}
                                            >
                                              {secExpanded ? (
                                                <CaretDown className="h-3.5 w-3.5 text-muted-foreground" />
                                              ) : (
                                                <CaretRight className="h-3.5 w-3.5 text-muted-foreground" />
                                              )}
                                              <span className="text-xs font-medium text-muted-foreground">
                                                Images ({product.images!.length})
                                              </span>
                                            </button>
                                            {secExpanded && (
                                              <div className="ml-4 pl-2 border-l border-border">
                                                {product.images!.map((img, i) => (
                                                  <div key={i} className="py-1 px-2 text-xs text-muted-foreground truncate">
                                                    <a
                                                      href={img}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="hover:underline hover:text-foreground"
                                                    >
                                                      {img}
                                                    </a>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkle className="h-5 w-5" />
                AI Mockups
              </CardTitle>
              <CardDescription>
                Generate website look & feel proposals based on your analysis
              </CardDescription>
            </div>
            {!showMockupForm && !generatedPrompt && !generatingPrompt && !generatingImage && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMockupForm(true)}
              >
                <MagicWand className="h-4 w-4 mr-2" />
                Generate Mockup
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Step 1: Settings Form */}
          {showMockupForm && (
            <div className="space-y-4 mb-6 p-4 rounded-lg border bg-muted/30">
              {/* Visual References — required, shown first */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Visual References
                  <span className="text-destructive">*</span>
                </label>
                <p className="text-xs text-muted-foreground">
                  Upload at least one image as a visual style reference. Click the star to mark one as the primary — Gemini will match its colors, fonts, and layout above all others.
                </p>
                {mockupRefImages.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {mockupRefImages.map((img, i) => (
                      <div key={i} className={`relative group/thumb ${primaryRefIndex === i ? "ring-2 ring-yellow-400 rounded-md" : ""}`}>
                        <img
                          src={img}
                          alt={`Reference ${i + 1}`}
                          className="rounded-md border h-20 w-20 object-cover"
                        />
                        {/* Star button — toggle primary */}
                        <button
                          type="button"
                          className="absolute top-0.5 left-0.5 h-5 w-5 flex items-center justify-center rounded-full bg-background/80 hover:bg-background transition-colors"
                          title={primaryRefIndex === i ? "Remove as primary" : "Set as primary reference"}
                          onClick={() =>
                            setPrimaryRefIndex((prev) => (prev === i ? null : i))
                          }
                        >
                          <Star className={`h-3.5 w-3.5 ${primaryRefIndex === i ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                        </button>
                        {/* Remove button */}
                        <button
                          type="button"
                          className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center text-xs opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                          onClick={() => {
                            setMockupRefImages((prev) => prev.filter((_, j) => j !== i));
                            setPrimaryRefIndex((prev) => {
                              if (prev === null) return null;
                              if (prev === i) return null;
                              if (i < prev) return prev - 1;
                              return prev;
                            });
                          }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <label className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm cursor-pointer hover:bg-muted/50 transition-colors w-fit ${mockupFormTouched && mockupRefImages.length === 0 ? "border-destructive" : ""}`}>
                  <UploadSimple className="h-4 w-4 text-muted-foreground" />
                  <span>Upload images</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    disabled={generatingPrompt}
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      files.forEach((file) => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setMockupRefImages((prev) => {
                            const next = [...prev, reader.result as string];
                            if (prev.length === 0) {
                              setPrimaryRefIndex(0);
                            }
                            return next;
                          });
                        };
                        reader.readAsDataURL(file);
                      });
                      e.target.value = "";
                    }}
                  />
                </label>
                {mockupFormTouched && mockupRefImages.length === 0 && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <WarningCircle className="h-3 w-3" />
                    At least one visual reference image is required
                  </p>
                )}
                {mockupRefImages.length > 0 && primaryRefIndex === null && (
                  <p className="text-xs text-amber-500 flex items-center gap-1">
                    <WarningCircle className="h-3 w-3" />
                    Tip: Click the star on an image to set it as the primary reference for best results
                  </p>
                )}
              </div>

              <Separator />

              {/* Style, Page Type & Aspect Ratio — required */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Style Preset <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={mockupStyle}
                    onChange={(e) => setMockupStyle(e.target.value)}
                    disabled={generatingPrompt}
                    className="flex h-9 w-full rounded-[8px] border border-input bg-background px-3 pr-8 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="Modern Minimal">Modern Minimal</option>
                    <option value="Bold & Dark">Bold & Dark</option>
                    <option value="Playful & Colorful">Playful & Colorful</option>
                    <option value="Corporate Clean">Corporate Clean</option>
                    <option value="Luxury & Elegant">Luxury & Elegant</option>
                    <option value="Retrowave">Retrowave</option>
                    <option value="Futuristic">Futuristic</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Page Type <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={mockupPageType}
                    onChange={(e) => setMockupPageType(e.target.value)}
                    disabled={generatingPrompt}
                    className="flex h-9 w-full rounded-[8px] border border-input bg-background px-3 pr-8 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="Homepage">Homepage</option>
                    <option value="Product Page">Product Page</option>
                    <option value="Collection Page">Collection Page</option>
                    <option value="About Page">About Page</option>
                    <option value="Contact Page">Contact Page</option>
                    <option value="Blog Page">Blog Page</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Aspect Ratio
                  </label>
                  <select
                    value={mockupAspectRatio}
                    onChange={(e) => setMockupAspectRatio(e.target.value)}
                    disabled={generatingPrompt}
                    className="flex h-9 w-full rounded-[8px] border border-input bg-background px-3 pr-8 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="9:16">9:16 Full Page</option>
                    <option value="3:4">3:4 Portrait</option>
                    <option value="2:3">2:3 Tall Portrait</option>
                    <option value="1:1">1:1 Square</option>
                    <option value="4:3">4:3 Landscape</option>
                    <option value="3:2">3:2 Wide</option>
                    <option value="16:9">16:9 Widescreen</option>
                  </select>
                </div>
              </div>

              {/* Custom Instructions — optional */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">
                  Custom Instructions <span className="text-xs font-normal">(optional)</span>
                </label>
                <Textarea
                  placeholder="e.g. Use a hero section with a large product image, include a trust badges section..."
                  value={mockupCustomPrompt}
                  onChange={(e) => setMockupCustomPrompt(e.target.value)}
                  rows={3}
                  disabled={generatingPrompt}
                />
              </div>

              {/* Products — optional */}
              {products.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">
                    Include Products <span className="text-xs font-normal">(optional)</span>
                  </label>
                  <div className="max-h-60 overflow-y-auto rounded-md border p-2 space-y-1">
                    {products.map((product) => (
                      <div key={product.id}>
                        <label
                          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={selectedProductIds.includes(product.id)}
                            onChange={() => toggleProductSelection(product.id)}
                            disabled={generatingPrompt}
                            className="rounded border-input"
                          />
                          <span className="truncate flex-1">{product.name}</span>
                          {product.images && product.images.length > 0 && (
                            <span className="text-[10px] text-muted-foreground">{product.images.length} img</span>
                          )}
                        </label>
                        {/* Show product image thumbnails when selected */}
                        {selectedProductIds.includes(product.id) && product.images && product.images.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pl-8 pb-2 pt-1">
                            {product.images.map((imgUrl, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => toggleProductImageUrl(imgUrl)}
                                className={`relative rounded border overflow-hidden h-12 w-12 flex-shrink-0 transition-all ${
                                  selectedProductImageUrls.includes(imgUrl)
                                    ? "ring-2 ring-primary border-primary"
                                    : "opacity-60 hover:opacity-100"
                                }`}
                                title={selectedProductImageUrls.includes(imgUrl) ? "Remove from mockup" : "Include in mockup"}
                              >
                                <img
                                  src={imgUrl}
                                  alt={`${product.name} image ${idx + 1}`}
                                  className="h-full w-full object-cover"
                                />
                                {selectedProductImageUrls.includes(imgUrl) && (
                                  <div className="absolute top-0 right-0 bg-primary rounded-bl p-0.5">
                                    <Check className="h-2.5 w-2.5 text-primary-foreground" />
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {(selectedProductIds.length > 0 || selectedProductImageUrls.length > 0) && (
                    <p className="text-xs text-muted-foreground">
                      {selectedProductIds.length} product{selectedProductIds.length !== 1 ? "s" : ""} selected
                      {selectedProductImageUrls.length > 0 && ` + ${selectedProductImageUrls.length} product image${selectedProductImageUrls.length !== 1 ? "s" : ""} for mockup`}
                    </p>
                  )}
                </div>
              )}

              <Separator />

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    setMockupFormTouched(true);
                    if (mockupRefImages.length === 0) return;
                    handleGeneratePrompt();
                  }}
                  disabled={generatingPrompt}
                  size="sm"
                >
                  {generatingPrompt ? (
                    <SpinnerGap className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <MagicWand className="h-4 w-4 mr-2" />
                  )}
                  {generatingPrompt ? "Crafting Prompt..." : "Generate Prompt"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowMockupForm(false);
                    setMockupCustomPrompt("");
                    setMockupFormTouched(false);
                    setMockupRefImages([]);
                    setPrimaryRefIndex(null);
                    setSelectedProductImageUrls([]);
                  }}
                  disabled={generatingPrompt}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                {mockupFormTouched && mockupRefImages.length === 0 && (
                  <p className="text-xs text-destructive">Fix errors above to continue</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Prompt Review / Edit */}
          {generatedPrompt && !generatingImage && (
            <div className="space-y-4 mb-6 p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">AI-Generated Image Prompt</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {mockupPageType}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {mockupStyle}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {mockupAspectRatio}
                  </Badge>
                </div>
              </div>

              {/* Load Saved Prompt */}
              {(savedPrompts.length > 0 || mockups.length > 0) && (
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowLoadPrompt(!showLoadPrompt)}
                    className="w-full justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <BookmarkSimple className="h-4 w-4" />
                      Load Saved Prompt
                    </span>
                    <CaretDown className={`h-4 w-4 transition-transform ${showLoadPrompt ? "rotate-180" : ""}`} />
                  </Button>
                  {showLoadPrompt && (
                    <div className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-lg max-h-64 overflow-y-auto">
                      {savedPrompts.length > 0 && (
                        <div>
                          <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/50">
                            Saved Prompts
                          </p>
                          {savedPrompts.map((sp) => (
                            <div
                              key={sp.id}
                              className="flex items-center justify-between px-3 py-2 hover:bg-muted/50 group"
                            >
                              {renamingPromptId === sp.id ? (
                                <div className="flex items-center gap-1 flex-1 mr-2">
                                  <Input
                                    value={renameValue}
                                    onChange={(e) => setRenameValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") renameSavedPrompt(sp.id);
                                      if (e.key === "Escape") { setRenamingPromptId(null); setRenameValue(""); }
                                    }}
                                    className="h-7 text-sm"
                                    autoFocus
                                  />
                                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => renameSavedPrompt(sp.id)}>
                                    <CheckCircle className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setRenamingPromptId(null); setRenameValue(""); }}>
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    className="flex-1 text-left"
                                    onClick={() => loadSavedPrompt(sp)}
                                  >
                                    <p className="text-sm font-medium truncate">{sp.name}</p>
                                    <p className="text-[10px] text-muted-foreground">
                                      {sp.pageType && <span>{sp.pageType}</span>}
                                      {sp.pageType && sp.style && <span> · </span>}
                                      {sp.style && <span>{sp.style}</span>}
                                      {(sp.pageType || sp.style) && <span> · </span>}
                                      {formatDateShort(sp.updatedAt)}
                                    </p>
                                  </button>
                                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      type="button"
                                      className="h-6 w-6 rounded flex items-center justify-center hover:bg-muted"
                                      onClick={(e) => { e.stopPropagation(); setRenamingPromptId(sp.id); setRenameValue(sp.name); }}
                                      title="Rename"
                                    >
                                      <PencilSimple className="h-3 w-3" />
                                    </button>
                                    <button
                                      type="button"
                                      className="h-6 w-6 rounded flex items-center justify-center hover:bg-destructive/10 text-destructive"
                                      onClick={(e) => { e.stopPropagation(); deleteSavedPrompt(sp.id); }}
                                      title="Delete"
                                    >
                                      <Trash className="h-3 w-3" />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {mockups.length > 0 && (
                        <div>
                          <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/50">
                            From Previous Mockups
                          </p>
                          {mockups.map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              className="w-full text-left px-3 py-2 hover:bg-muted/50"
                              onClick={() => loadPromptFromMockup(m)}
                            >
                              <p className="text-sm font-medium truncate">
                                {m.label || "Mockup"} — {m.style || "Custom"}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {formatDate(m.createdAt)}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Review and edit the prompt below before generating the image
              </p>
              <Textarea
                value={editedPrompt}
                onChange={(e) => setEditedPrompt(e.target.value)}
                rows={14}
                className="font-mono text-sm"
              />

              <Separator />

              {/* Visual References summary (uploaded in step 1) */}
              {mockupRefImages.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Visual References ({mockupRefImages.length})
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {mockupRefImages.map((img, i) => (
                      <div key={i} className={`relative ${primaryRefIndex === i ? "ring-2 ring-yellow-400 rounded-md" : ""}`}>
                        <img
                          src={img}
                          alt={`Reference ${i + 1}`}
                          className="rounded-md border h-16 w-16 object-cover"
                        />
                        {primaryRefIndex === i && (
                          <Star className="absolute top-0.5 left-0.5 h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {primaryRefIndex !== null ? "Primary reference marked — Gemini will prioritize it." : "No primary selected."} These images will be sent alongside the prompt.
                  </p>
                </div>
              )}

              {/* Logo & Product Images summary */}
              {(data?.project.logo || selectedProductImageUrls.length > 0) && (
                <div className="space-y-2">
                  {data?.project.logo && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Logo attached
                      </Badge>
                      <img
                        src={data.project.logo}
                        alt="Brand logo"
                        className="h-8 w-auto max-w-[80px] object-contain rounded border bg-gray-100 p-0.5"
                      />
                    </div>
                  )}
                  {selectedProductImageUrls.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1">
                          <Package className="h-3 w-3" />
                          {selectedProductImageUrls.length} product image{selectedProductImageUrls.length !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedProductImageUrls.map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            alt={`Product ${i + 1}`}
                            className="h-12 w-12 rounded border object-cover"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Style References (text) */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <PencilSimple className="h-4 w-4" />
                  Style References (optional)
                </label>
                <p className="text-xs text-muted-foreground">
                  Add text-based style notes — these will be appended to the prompt before image generation
                </p>
                <Textarea
                  placeholder="e.g. Use a warm earth-tone palette like Aesop.com, rounded corners on all cards, large white space between sections, editorial photography style..."
                  value={mockupStyleRef}
                  onChange={(e) => setMockupStyleRef(e.target.value)}
                  rows={3}
                />
              </div>

              <Separator />

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleGenerateImage}
                  disabled={!editedPrompt.trim()}
                  size="sm"
                >
                  <Sparkle className="h-4 w-4 mr-2" />
                  Generate Image
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGeneratePrompt}
                  disabled={generatingPrompt}
                >
                  {generatingPrompt ? (
                    <SpinnerGap className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ArrowsClockwise className="h-4 w-4 mr-2" />
                  )}
                  Regenerate Prompt
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setGeneratedPrompt("");
                    setEditedPrompt("");
                    setMockupRefImages([]);
                    setPrimaryRefIndex(null);
                    setMockupFormTouched(false);
                    setMockupStyleRef("");
                    setSelectedProductImageUrls([]);
                    setShowMockupForm(true);
                  }}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Settings
                </Button>

                <div className="ml-auto flex items-center gap-2">
                  {savedPromptSuccess && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Saved
                    </span>
                  )}
                  {showSavePrompt ? (
                    <div className="flex items-center gap-1">
                      <Input
                        placeholder="Prompt name..."
                        value={promptName}
                        onChange={(e) => setPromptName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !savingPrompt) handleSavePrompt();
                          if (e.key === "Escape") { setShowSavePrompt(false); setPromptName(""); }
                        }}
                        disabled={savingPrompt}
                        className="h-8 w-48 text-sm"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={handleSavePrompt}
                        disabled={!promptName.trim() || savingPrompt}
                        className="h-8"
                      >
                        {savingPrompt ? (
                          <SpinnerGap className="h-4 w-4 animate-spin" />
                        ) : (
                          <FloppyDisk className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setShowSavePrompt(false); setPromptName(""); }}
                        disabled={savingPrompt}
                        className="h-8"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSavePrompt(true)}
                      disabled={!editedPrompt.trim()}
                    >
                      <BookmarkSimple className="h-4 w-4 mr-2" />
                      Save Prompt
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Generating image spinner */}
          {generatingImage && (
            <div className="flex flex-col items-center justify-center p-8 gap-3 mb-6">
              <SpinnerGap className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Generating mockup image... This may take a moment.</p>
            </div>
          )}

          {mockups.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mockups.map((mockup) => (
                <div
                  key={mockup.id}
                  className="group relative flex flex-col rounded-lg border overflow-hidden hover:border-primary/50 hover:shadow-md transition-all"
                >
                  <button
                    type="button"
                    className="text-left"
                    onClick={() => setViewingPromptLog(mockup)}
                  >
                    <div className="relative aspect-video bg-muted overflow-hidden">
                      <img
                        src={mockup.image}
                        alt={`Mockup: ${mockup.label || "AI Generated"}`}
                        className="w-full h-full object-cover object-top transition-transform group-hover:scale-105"
                      />
                    </div>
                    <div className="p-3 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {mockup.label && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {mockup.label}
                          </Badge>
                        )}
                        {mockup.style && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {mockup.style}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(mockup.createdAt)}
                      </p>
                    </div>
                  </button>
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      className="h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingPromptLog(mockup);
                      }}
                      title="View prompt log"
                    >
                      <FileText className="h-3.5 w-3.5" />
                    </button>
                    <a
                      href={mockup.image}
                      download={`mockup-${mockup.label || "design"}-${new Date(mockup.createdAt).toISOString().slice(0, 10)}.png`}
                      className="h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-primary"
                      onClick={(e) => e.stopPropagation()}
                      title="Download image"
                    >
                      <DownloadSimple className="h-3.5 w-3.5" />
                    </a>
                    <button
                      type="button"
                      className="h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMockup(mockup.id);
                      }}
                      title="Delete mockup"
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : !showMockupForm && !generatedPrompt && !generatingPrompt && !generatingImage ? (
            <button
              onClick={() => setShowMockupForm(true)}
              className="w-full p-4 rounded-lg border border-dashed text-sm text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors text-center"
            >
              Generate AI mockups based on your analysis and competitor research
            </button>
          ) : null}
        </CardContent>
      </Card>

      {/* Prompt Log Dialog */}
      <Dialog open={!!viewingPromptLog} onOpenChange={(open) => !open && setViewingPromptLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Prompt Log
              {viewingPromptLog?.label && (
                <Badge variant="secondary" className="text-xs">{viewingPromptLog.label}</Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {viewingPromptLog && (
            <div className="space-y-4">
              {/* Mockup image thumbnail */}
              <div
                className="relative group/mockthumb cursor-pointer rounded-lg overflow-hidden border"
                onClick={() => {
                  setViewingScreenshot({
                    url: viewingPromptLog.image,
                    title: `${viewingPromptLog.label || "Mockup"} — ${viewingPromptLog.style || "Custom"}`,
                  });
                }}
              >
                <img
                  src={viewingPromptLog.image}
                  alt={`Mockup: ${viewingPromptLog.label || "AI Generated"}`}
                  className="w-full max-h-64 object-cover object-top"
                />
                <div className="absolute inset-0 bg-black/0 group-hover/mockthumb:bg-black/40 transition-colors flex items-center justify-center gap-3">
                  <span className="text-white text-sm font-medium opacity-0 group-hover/mockthumb:opacity-100 transition-opacity flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    View Full Image
                  </span>
                </div>
                <a
                  href={viewingPromptLog.image}
                  download={`mockup-${viewingPromptLog.label || "design"}-${new Date(viewingPromptLog.createdAt).toISOString().slice(0, 10)}.png`}
                  className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-primary opacity-0 group-hover/mockthumb:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                  title="Download image"
                >
                  <DownloadSimple className="h-4 w-4" />
                </a>
              </div>

              {viewingPromptLog.customInstructions && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Custom Instructions</h4>
                  <pre className="text-xs bg-muted rounded-md p-3 whitespace-pre-wrap break-words">{viewingPromptLog.customInstructions}</pre>
                </div>
              )}
              {viewingPromptLog.originalPrompt && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium">Original AI Prompt</h4>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleCopy(viewingPromptLog!.originalPrompt!, "originalPrompt")}
                      title="Copy original prompt"
                    >
                      {copiedField === "originalPrompt" ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                  <pre className="text-xs bg-muted rounded-md p-3 whitespace-pre-wrap break-words max-h-60 overflow-y-auto">{viewingPromptLog.originalPrompt}</pre>
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-medium">Final Prompt</h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleCopy(viewingPromptLog!.prompt, "finalPrompt")}
                    title="Copy final prompt"
                  >
                    {copiedField === "finalPrompt" ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
                <pre className="text-xs bg-muted rounded-md p-3 whitespace-pre-wrap break-words max-h-60 overflow-y-auto">{viewingPromptLog.prompt}</pre>
              </div>
              {viewingPromptLog.styleRef && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Style References</h4>
                  <pre className="text-xs bg-muted rounded-md p-3 whitespace-pre-wrap break-words">{viewingPromptLog.styleRef}</pre>
                </div>
              )}
              {!viewingPromptLog.originalPrompt && !viewingPromptLog.customInstructions && !viewingPromptLog.styleRef && (
                <p className="text-sm text-muted-foreground italic">No detailed prompt history was recorded for this mockup.</p>
              )}

              {/* Refine Mockup button */}
              <div className="pt-2 border-t">
                <Button
                  onClick={() => {
                    const m = viewingPromptLog;
                    if (m.style) setMockupStyle(m.style);
                    if (m.label) setMockupPageType(m.label);
                    if (m.customInstructions) setMockupCustomPrompt(m.customInstructions);
                    setGeneratedPrompt(m.originalPrompt || m.prompt);
                    setEditedPrompt(m.prompt);
                    if (m.styleRef) setMockupStyleRef(m.styleRef);
                    setShowMockupForm(false);
                    setViewingPromptLog(null);
                    toast.success("Mockup loaded — edit and regenerate");
                  }}
                  className="w-full"
                >
                  <ArrowsClockwise className="h-4 w-4 mr-2" />
                  Refine Mockup
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {pages.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Scraped Pages</CardTitle>
                <CardDescription>
                  {visiblePages.length} page{visiblePages.length !== 1 ? "s" : ""} collected from
                  the website
                </CardDescription>
              </div>
              {archivedCount > 0 && (
                <Link
                  href={`/projects/${id}/archived`}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Archive className="h-3.5 w-3.5" />
                  {archivedCount} archived
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visiblePages.map((page) => (
                <div
                  key={page.id}
                  className="flex flex-col rounded-lg border overflow-hidden transition-all group hover:border-primary/50 hover:shadow-md"
                >
                  <Link href={`/projects/${id}/pages/${page.id}`}>
                    <div className="relative aspect-video bg-muted overflow-hidden">
                      {page.screenshot ? (
                        <>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <SpinnerGap className="h-8 w-8 animate-spin text-primary" />
                          </div>
                          <img
                            src={page.screenshot}
                            alt={`Screenshot of ${page.title || page.url}`}
                            className="relative w-full h-full object-cover object-top transition-transform group-hover:scale-105"
                            onLoad={(e) => { (e.currentTarget.previousElementSibling as HTMLElement)?.remove(); }}
                          />
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
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
                      <ArrowSquareOut className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </Link>
                  <div className="px-3 pb-3 space-y-2">
                    {(() => {
                      const pageProducts = products.filter(p => p.pageId === page.id);
                      if (pageProducts.length === 0) return null;
                      const latest = pageProducts.reduce((a, b) => new Date(a.updatedAt) > new Date(b.updatedAt) ? a : b);
                      return (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 rounded-md px-2 py-1.5">
                          <Package className="h-3 w-3 shrink-0" />
                          <span>{pageProducts.length} product{pageProducts.length !== 1 ? "s" : ""} extracted</span>
                          <span className="text-emerald-500 ml-auto shrink-0">{formatDateShort(latest.updatedAt)}</span>
                        </div>
                      );
                    })()}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        disabled={extractingProducts === page.id}
                        onClick={() => handleExtractProducts(page.id)}
                      >
                        {extractingProducts === page.id ? (
                          <SpinnerGap className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <ShoppingBag className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        {extractingProducts === page.id ? "Extracting..." : products.some(p => p.pageId === page.id) ? "Re-extract Products" : "Extract Products"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs px-2 text-muted-foreground hover:text-foreground"
                        disabled={archivingPageId === page.id}
                        onClick={() => handleArchivePage(page.id, 1)}
                        title="Archive page"
                      >
                        {archivingPageId === page.id ? (
                          <SpinnerGap className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Archive className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
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

function AnalysisIcon({ type, size = "lg" }: { type: string; size?: "sm" | "lg" }) {
  const config: Record<string, { icon: React.ReactNode; bg: string; text: string }> = {
    marketing: {
      icon: size === "lg" ? <ChartBar className="h-7 w-7" /> : <ChartBar className="h-4 w-4" />,
      bg: "bg-blue-100 dark:bg-blue-900/40",
      text: "text-blue-600 dark:text-blue-400",
    },
    techstack: {
      icon: size === "lg" ? <CodeBlock className="h-7 w-7" /> : <CodeBlock className="h-4 w-4" />,
      bg: "bg-emerald-100 dark:bg-emerald-900/40",
      text: "text-emerald-600 dark:text-emerald-400",
    },
    architecture: {
      icon: size === "lg" ? <TreeStructure className="h-7 w-7" /> : <TreeStructure className="h-4 w-4" />,
      bg: "bg-violet-100 dark:bg-violet-900/40",
      text: "text-violet-600 dark:text-violet-400",
    },
    performance: {
      icon: size === "lg" ? <Lightning className="h-7 w-7" /> : <Lightning className="h-4 w-4" />,
      bg: "bg-orange-100 dark:bg-orange-900/40",
      text: "text-orange-600 dark:text-orange-400",
    },
    recommendations: {
      icon: size === "lg" ? <Lightbulb className="h-7 w-7" /> : <Lightbulb className="h-4 w-4" />,
      bg: "bg-rose-100 dark:bg-rose-900/40",
      text: "text-rose-600 dark:text-rose-400",
    },
  };

  const c = config[type] || { icon: type[0].toUpperCase(), bg: "bg-muted", text: "text-foreground" };
  const circleSize = size === "lg" ? "h-14 w-14" : "h-6 w-6";

  return (
    <div className={`${circleSize} rounded-full ${c.bg} ${c.text} flex items-center justify-center`}>
      {c.icon}
    </div>
  );
}
