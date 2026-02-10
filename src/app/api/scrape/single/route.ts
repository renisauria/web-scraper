import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { scrapeSinglePage } from "@/lib/firecrawl";
import { z } from "zod";
import { logError } from "@/lib/error-logger";

const singleScrapeSchema = z.object({
  projectId: z.string().uuid("Valid project ID is required"),
  url: z.string().url("Valid URL is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, url } = singleScrapeSchema.parse(body);

    // Verify project exists
    const project = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, projectId))
      .limit(1);

    if (project.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if URL already exists for this project
    const existingPage = await db
      .select()
      .from(schema.pages)
      .where(
        and(
          eq(schema.pages.projectId, projectId),
          eq(schema.pages.url, url)
        )
      )
      .limit(1);

    if (existingPage.length > 0) {
      return NextResponse.json(
        { error: "This URL has already been scraped for this project" },
        { status: 409 }
      );
    }

    // Scrape the single page
    const scrapedPage = await scrapeSinglePage(url);

    if (!scrapedPage) {
      return NextResponse.json(
        { error: "Failed to scrape the URL" },
        { status: 500 }
      );
    }

    // Save to database
    const pageRecord = {
      id: uuidv4(),
      projectId,
      url: scrapedPage.url || url,
      title: scrapedPage.title || null,
      content: scrapedPage.markdown || scrapedPage.content || null,
      screenshot: scrapedPage.screenshot || null,
      metadata: scrapedPage.metadata || null,
      version: 1,
      createdAt: new Date(),
    };

    await db.insert(schema.pages).values(pageRecord);

    // Update project timestamp
    await db
      .update(schema.projects)
      .set({ updatedAt: new Date() })
      .where(eq(schema.projects.id, projectId));

    return NextResponse.json({
      success: true,
      page: pageRecord,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    await logError({ route: "/api/scrape/single", method: "POST", error });
    return NextResponse.json(
      { error: "Failed to scrape URL" },
      { status: 500 }
    );
  }
}
