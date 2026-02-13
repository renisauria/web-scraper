import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { buildCurrentSitemap, buildSitemapFromUrls, enrichSitemapWithPages } from "@/lib/sitemap";
import { fetchAndParseSitemapXml } from "@/lib/sitemap-xml";
import { generateRecommendedSitemap } from "@/lib/anthropic";
import { logError } from "@/lib/error-logger";
import type { SitemapData } from "@/types";

const createSitemapSchema = z.object({
  projectId: z.string(),
  type: z.enum(["current", "recommended"]),
  source: z.enum(["scrape", "import-xml"]).optional().default("scrape"),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const type = searchParams.get("type") as "current" | "recommended" | null;

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const conditions = [eq(schema.sitemaps.projectId, projectId)];
    if (type) {
      conditions.push(eq(schema.sitemaps.type, type));
    }

    const sitemaps = await db
      .select()
      .from(schema.sitemaps)
      .where(and(...conditions));

    // Fetch scraped pages once and enrich current sitemaps so
    // hasContent / pageId are always up-to-date with what's been scraped.
    const project = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, projectId))
      .limit(1);

    if (project.length > 0) {
      const pages = await db
        .select()
        .from(schema.pages)
        .where(eq(schema.pages.projectId, projectId));

      if (pages.length > 0) {
        for (const sitemap of sitemaps) {
          if (sitemap.type === "current" && sitemap.data) {
            enrichSitemapWithPages(
              sitemap.data as unknown as SitemapData,
              pages,
              project[0].url
            );
          }
        }
      }
    }

    return NextResponse.json({ sitemaps });
  } catch (error) {
    await logError({ route: "/api/sitemap", method: "GET", error });
    return NextResponse.json(
      { error: "Failed to fetch sitemaps" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, type, source } = createSitemapSchema.parse(body);

    // Get project
    const project = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, projectId))
      .limit(1);

    if (project.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    let sitemapData;
    let importStats: { urlCount: number; childSitemapsFound: number } | undefined;

    if (source === "import-xml" && type === "current") {
      const result = await fetchAndParseSitemapXml(project[0].url);
      if (result.urls.length === 0) {
        const errorMsg = result.errors.length > 0
          ? result.errors.join("; ")
          : "No URLs found in sitemap.xml";
        return NextResponse.json({ error: errorMsg }, { status: 400 });
      }
      sitemapData = buildSitemapFromUrls(result.urls, project[0].url);

      // Enrich with any already-scraped pages
      const scrapedPages = await db
        .select()
        .from(schema.pages)
        .where(eq(schema.pages.projectId, projectId));
      if (scrapedPages.length > 0) {
        enrichSitemapWithPages(sitemapData, scrapedPages, project[0].url);
      }

      importStats = {
        urlCount: result.urls.length,
        childSitemapsFound: result.childSitemapsFound,
      };
    } else {
      // Scrape-based flow
      const pages = await db
        .select()
        .from(schema.pages)
        .where(eq(schema.pages.projectId, projectId));

      if (pages.length === 0) {
        return NextResponse.json(
          { error: "No scraped pages found. Scrape the website first." },
          { status: 400 }
        );
      }

      if (type === "current") {
        sitemapData = buildCurrentSitemap(pages, project[0].url);
      } else {
        // recommended - need current sitemap + AI generation
        const existingCurrentSitemaps = await db
          .select()
          .from(schema.sitemaps)
          .where(
            and(
              eq(schema.sitemaps.projectId, projectId),
              eq(schema.sitemaps.type, "current")
            )
          );

        let currentSitemap;
        if (existingCurrentSitemaps.length === 0) {
          currentSitemap = buildCurrentSitemap(pages, project[0].url);
        } else {
          currentSitemap = existingCurrentSitemaps[0].data;
        }

        const combinedContent = pages
          .map((page) => {
            const title = page.title ? `# ${page.title}\nURL: ${page.url}\n\n` : `URL: ${page.url}\n\n`;
            return title + (page.content || "").slice(0, 2000);
          })
          .join("\n\n---\n\n");

        const maxContentLength = 30000;
        const truncatedContent =
          combinedContent.length > maxContentLength
            ? combinedContent.slice(0, maxContentLength) + "\n\n[Content truncated...]"
            : combinedContent;

        const proj = project[0];
        sitemapData = await generateRecommendedSitemap(
          currentSitemap as Record<string, unknown>,
          truncatedContent,
          {
            clientName: proj.clientName,
            clientProblems: proj.clientProblems,
            competitorAnalysis: proj.competitorAnalysis,
            projectUrl: proj.url,
          }
        );
      }
    }

    // Upsert: delete existing sitemap of same type for this project
    const existing = await db
      .select()
      .from(schema.sitemaps)
      .where(
        and(
          eq(schema.sitemaps.projectId, projectId),
          eq(schema.sitemaps.type, type)
        )
      );

    if (existing.length > 0) {
      await db
        .delete(schema.sitemaps)
        .where(eq(schema.sitemaps.id, existing[0].id));
    }

    const sitemapRecord = {
      id: uuidv4(),
      projectId,
      type,
      data: sitemapData as Record<string, unknown>,
      createdAt: new Date(),
    };

    await db.insert(schema.sitemaps).values(sitemapRecord);

    return NextResponse.json({ sitemap: { ...sitemapRecord, data: sitemapData }, importStats }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    await logError({ route: "/api/sitemap", method: "POST", error });
    return NextResponse.json(
      { error: "Failed to generate sitemap" },
      { status: 500 }
    );
  }
}
