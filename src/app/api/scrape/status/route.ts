import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getCrawlStatus } from "@/lib/firecrawl";
import { detectPlatform } from "@/lib/platform-detector";
import { compressScreenshots } from "@/lib/screenshot-compress";
import { logError } from "@/lib/error-logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    // Get project with crawl job ID
    const project = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, projectId))
      .limit(1);

    if (project.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { crawlJobId, status: projectStatus } = project[0];

    // If not scraping, return current status
    if (projectStatus !== "scraping" || !crawlJobId) {
      return NextResponse.json({
        success: true,
        status: projectStatus,
        completed: 0,
        total: 0,
      });
    }

    // Check crawl status with Firecrawl
    const crawlStatus = await getCrawlStatus(crawlJobId);

    if (!crawlStatus.success) {
      // Mark project as error
      await db
        .update(schema.projects)
        .set({
          status: "error",
          crawlJobId: null,
          updatedAt: new Date(),
        })
        .where(eq(schema.projects.id, projectId));

      return NextResponse.json({
        success: false,
        status: "error",
        completed: 0,
        total: 0,
        error: crawlStatus.error,
      });
    }

    // If crawl is complete, save pages and update project
    if (crawlStatus.status === "completed" && crawlStatus.pages) {
      // Batch-compress all screenshots to WebP
      const rawScreenshots = crawlStatus.pages.map((p) => p.screenshot || null);
      const compressed = await compressScreenshots(rawScreenshots);

      const pageRecords = crawlStatus.pages.map((page, i) => ({
        id: uuidv4(),
        projectId,
        url: page.url,
        title: page.title || null,
        content: page.markdown || page.content || null,
        screenshot: compressed[i],
        metadata: page.metadata || null,
        version: 1,
        createdAt: new Date(),
      }));

      if (pageRecords.length > 0) {
        await db.insert(schema.pages).values(pageRecords);
      }

      // Run platform detection on raw HTML + metadata
      const detectionInput = crawlStatus.pages.map((page) => ({
        url: page.url,
        html: page.content || undefined,
        metadata: page.metadata || undefined,
      }));
      const platformInfo = detectPlatform(detectionInput);

      await db
        .update(schema.projects)
        .set({
          status: "scraped",
          crawlJobId: null,
          platformInfo,
          updatedAt: new Date(),
        })
        .where(eq(schema.projects.id, projectId));

      return NextResponse.json({
        success: true,
        status: "completed",
        completed: crawlStatus.completed,
        total: crawlStatus.total,
        pagesScraped: pageRecords.length,
      });
    }

    // If crawl failed or was cancelled
    if (crawlStatus.status === "failed" || crawlStatus.status === "cancelled") {
      await db
        .update(schema.projects)
        .set({
          status: "error",
          crawlJobId: null,
          updatedAt: new Date(),
        })
        .where(eq(schema.projects.id, projectId));

      return NextResponse.json({
        success: false,
        status: crawlStatus.status,
        completed: crawlStatus.completed,
        total: crawlStatus.total,
        error: `Crawl ${crawlStatus.status}`,
      });
    }

    // Still scraping - return progress
    return NextResponse.json({
      success: true,
      status: "scraping",
      completed: crawlStatus.completed,
      total: crawlStatus.total,
    });
  } catch (error) {
    await logError({ route: "/api/scrape/status", method: "GET", error });
    return NextResponse.json(
      { error: "Failed to check scrape status" },
      { status: 500 }
    );
  }
}
