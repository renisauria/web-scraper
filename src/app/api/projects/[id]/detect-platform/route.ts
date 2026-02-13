import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { detectPlatform } from "@/lib/platform-detector";
import { logError } from "@/lib/error-logger";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const project = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, id))
      .limit(1);

    if (project.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const pages = await db
      .select()
      .from(schema.pages)
      .where(eq(schema.pages.projectId, id));

    if (pages.length === 0) {
      return NextResponse.json(
        { error: "No scraped pages to detect platform from" },
        { status: 400 }
      );
    }

    // Fetch HTML for ALL pages with concurrency limit to get complete template data
    const CONCURRENCY = 10;
    const fetchResults: { url: string; html?: string; metadata?: Record<string, unknown> }[] = [];

    for (let i = 0; i < pages.length; i += CONCURRENCY) {
      const batch = pages.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.all(
        batch.map(async (page) => {
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);
            const res = await fetch(page.url, {
              signal: controller.signal,
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (compatible; WebScraperBot/1.0)",
              },
            });
            clearTimeout(timeout);
            const html = await res.text();
            return {
              url: page.url,
              html,
              metadata: (page.metadata as Record<string, unknown>) ?? undefined,
            };
          } catch {
            return {
              url: page.url,
              metadata: (page.metadata as Record<string, unknown>) ?? undefined,
            };
          }
        })
      );
      fetchResults.push(...batchResults);
    }

    const platformInfo = detectPlatform(fetchResults);

    await db
      .update(schema.projects)
      .set({ platformInfo, updatedAt: new Date() })
      .where(eq(schema.projects.id, id));

    return NextResponse.json({ platformInfo });
  } catch (error) {
    await logError({
      route: "/api/projects/[id]/detect-platform",
      method: "POST",
      error,
    });
    return NextResponse.json(
      { error: "Failed to detect platform" },
      { status: 500 }
    );
  }
}
