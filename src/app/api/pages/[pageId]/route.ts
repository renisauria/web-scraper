import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { scrapeSinglePage } from "@/lib/firecrawl";

export async function GET(
  request: NextRequest,
  { params }: { params: { pageId: string } }
) {
  try {
    const { pageId } = params;

    const page = await db
      .select()
      .from(schema.pages)
      .where(eq(schema.pages.id, pageId))
      .limit(1);

    if (page.length === 0) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Get the project info for breadcrumb
    const project = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, page[0].projectId))
      .limit(1);

    // Get version history
    const versions = await db
      .select()
      .from(schema.pageVersions)
      .where(eq(schema.pageVersions.pageId, pageId))
      .orderBy(desc(schema.pageVersions.version));

    return NextResponse.json({
      page: page[0],
      project: project[0] || null,
      versions,
    });
  } catch (error) {
    console.error("Error fetching page:", error);
    return NextResponse.json(
      { error: "Failed to fetch page" },
      { status: 500 }
    );
  }
}

// Re-scrape a specific page (creates a new version)
export async function POST(
  request: NextRequest,
  { params }: { params: { pageId: string } }
) {
  try {
    const { pageId } = params;

    // Get existing page
    const existingPage = await db
      .select()
      .from(schema.pages)
      .where(eq(schema.pages.id, pageId))
      .limit(1);

    if (existingPage.length === 0) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const currentPage = existingPage[0];
    const pageUrl = currentPage.url;

    // Re-scrape the page
    const scrapedPage = await scrapeSinglePage(pageUrl);

    if (!scrapedPage) {
      return NextResponse.json(
        { error: "Failed to scrape the URL" },
        { status: 500 }
      );
    }

    // Save current version to history before updating
    await db.insert(schema.pageVersions).values({
      id: uuidv4(),
      pageId: pageId,
      version: currentPage.version,
      url: currentPage.url,
      title: currentPage.title,
      content: currentPage.content,
      screenshot: currentPage.screenshot,
      fullPageScreenshot: currentPage.fullPageScreenshot,
      metadata: currentPage.metadata,
      createdAt: currentPage.createdAt,
    });

    // Update the page record with new version (reset full-page screenshot for new version)
    const newVersion = currentPage.version + 1;
    await db
      .update(schema.pages)
      .set({
        title: scrapedPage.title || null,
        content: scrapedPage.markdown || scrapedPage.content || null,
        screenshot: scrapedPage.screenshot || null,
        fullPageScreenshot: null, // Reset - user can capture new one if needed
        metadata: scrapedPage.metadata || null,
        version: newVersion,
        createdAt: new Date(),
      })
      .where(eq(schema.pages.id, pageId));

    // Fetch updated page
    const updatedPage = await db
      .select()
      .from(schema.pages)
      .where(eq(schema.pages.id, pageId))
      .limit(1);

    return NextResponse.json({
      success: true,
      page: updatedPage[0],
      previousVersion: currentPage.version,
      newVersion,
    });
  } catch (error) {
    console.error("Error re-scraping page:", error);
    return NextResponse.json(
      { error: "Failed to re-scrape page" },
      { status: 500 }
    );
  }
}
