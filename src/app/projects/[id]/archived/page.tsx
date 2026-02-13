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
import {
  CaretRight,
  Archive,
  ArrowCounterClockwise,
  SpinnerGap,
  WarningCircle,
  CheckCircle,
  ArrowSquareOut,
  Image as ImageIcon,
} from "@phosphor-icons/react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import type { Page, Project } from "@/types";
import { formatDate } from "@/lib/format-date";

interface ArchivedData {
  project: Project;
  pages: Page[];
}

export default function ArchivedPagesPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();
  const [data, setData] = useState<ArchivedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [restoringPageId, setRestoringPageId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
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
      setData({
        project: projectData.project,
        pages: projectData.pages.filter((p: Page) => p.archived === 1),
      });
    } catch {
      toast.error("Failed to load archived pages");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleRestore(pageId: string) {
    setRestoringPageId(pageId);
    try {
      const res = await fetch(`/api/pages/${pageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: 0 }),
      });
      if (!res.ok) throw new Error("Failed to restore page");
      await fetchData();
      toast.success("Page restored");
    } catch {
      toast.error("Failed to restore page");
    } finally {
      setRestoringPageId(null);
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
        <WarningCircle className="h-5 w-5" />
        <AlertDescription>Project not found</AlertDescription>
      </Alert>
    );
  }

  const { project, pages } = data;

  return (
    <div className="space-y-6">
      <nav className="flex items-center text-sm text-muted-foreground">
        <Link href="/projects" className="hover:text-foreground transition-colors">
          Projects
        </Link>
        <CaretRight className="h-4 w-4 mx-2" />
        <Link
          href={`/projects/${id}`}
          className="hover:text-foreground transition-colors"
        >
          {project.name}
        </Link>
        <CaretRight className="h-4 w-4 mx-2" />
        <span className="text-foreground font-medium">Archived Pages</span>
      </nav>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Archived Pages</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {pages.length} archived page{pages.length !== 1 ? "s" : ""} from {project.name}
          </p>
        </div>
        <Link href={`/projects/${id}`}>
          <Button variant="outline" size="sm">
            Back to project
          </Button>
        </Link>
      </div>

      {pages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Archive className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No archived pages</p>
            <Link href={`/projects/${id}`}>
              <Button variant="link" size="sm" className="mt-2">
                Back to project
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pages.map((page) => (
                <div
                  key={page.id}
                  className="flex flex-col rounded-lg border border-dashed overflow-hidden group"
                >
                  <Link href={`/projects/${id}/pages/${page.id}`}>
                    <div className="relative aspect-video bg-muted overflow-hidden">
                      {page.screenshot ? (
                        <img
                          src={page.screenshot}
                          alt={`Screenshot of ${page.title || page.url}`}
                          className="w-full h-full object-cover object-top"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <CheckCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="overflow-hidden">
                          <p className="font-medium truncate text-sm">
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
                  <div className="px-3 pb-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(page.createdAt)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      disabled={restoringPageId === page.id}
                      onClick={() => handleRestore(page.id)}
                    >
                      {restoringPageId === page.id ? (
                        <SpinnerGap className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <ArrowCounterClockwise className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      Restore
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
