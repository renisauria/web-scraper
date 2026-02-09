import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { startAsyncCrawl } from "@/lib/firecrawl";
import { z } from "zod";

const scrapeSchema = z.object({
  projectId: z.string().uuid("Valid project ID is required"),
  limit: z.number().min(1).max(500).optional().default(10),
  maxDepth: z.number().min(1).max(5).optional().default(2),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, limit, maxDepth } = scrapeSchema.parse(body);

    // Get project
    const project = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, projectId))
      .limit(1);

    if (project.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Start async crawl
    const result = await startAsyncCrawl(project[0].url, { limit, maxDepth });

    if (!result.success || !result.jobId) {
      await db
        .update(schema.projects)
        .set({ status: "error", updatedAt: new Date() })
        .where(eq(schema.projects.id, projectId));

      return NextResponse.json(
        { error: result.error || "Failed to start crawl" },
        { status: 500 }
      );
    }

    // Update project with job ID and scraping status
    await db
      .update(schema.projects)
      .set({
        status: "scraping",
        crawlJobId: result.jobId,
        updatedAt: new Date(),
      })
      .where(eq(schema.projects.id, projectId));

    // Delete existing pages for this project (they'll be replaced when crawl completes)
    await db.delete(schema.pages).where(eq(schema.pages.projectId, projectId));

    return NextResponse.json({
      success: true,
      jobId: result.jobId,
      message: "Crawl started",
    });
  } catch (error) {
    console.error("Error starting scrape:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to start scraping" },
      { status: 500 }
    );
  }
}
