import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { analyzeContent, analyzeAll, type AnalysisType } from "@/lib/openai";
import { z } from "zod";
import { logError } from "@/lib/error-logger";

const analyzeSchema = z.object({
  projectId: z.string().uuid("Valid project ID is required"),
  type: z
    .enum(["marketing", "techstack", "architecture", "performance", "recommendations", "all"])
    .optional()
    .default("all"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, type } = analyzeSchema.parse(body);

    // Get project
    const project = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, projectId))
      .limit(1);

    if (project.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get scraped pages
    const pages = await db
      .select()
      .from(schema.pages)
      .where(eq(schema.pages.projectId, projectId));

    if (pages.length === 0) {
      return NextResponse.json(
        { error: "No scraped content found. Please scrape the website first." },
        { status: 400 }
      );
    }

    // Update status to analyzing
    await db
      .update(schema.projects)
      .set({ status: "analyzing", updatedAt: new Date() })
      .where(eq(schema.projects.id, projectId));

    // Combine all page content for analysis
    const combinedContent = pages
      .map((page) => {
        const title = page.title ? `# ${page.title}\nURL: ${page.url}\n\n` : `URL: ${page.url}\n\n`;
        return title + (page.content || "");
      })
      .join("\n\n---\n\n");

    // Truncate content if too long (keeping within token limits)
    const maxContentLength = 50000;
    const truncatedContent =
      combinedContent.length > maxContentLength
        ? combinedContent.slice(0, maxContentLength) + "\n\n[Content truncated...]"
        : combinedContent;

    // Build rich context from project data
    const proj = project[0];
    let additionalContext = `Website: ${proj.url}`;
    if (proj.clientName) {
      additionalContext += `\nClient: ${proj.clientName}`;
    }
    if (proj.clientProblems) {
      additionalContext += `\nClient Problems: ${proj.clientProblems}`;
    }
    if (proj.competitorAnalysis) {
      additionalContext += `\nCompetitor Analysis & Desired Features: ${proj.competitorAnalysis}`;
    }
    if (proj.clientProblems || proj.competitorAnalysis) {
      additionalContext += `\n\nPlease specifically address the client's stated problems and goals in your analysis.`;
    }

    let results;
    if (type === "all") {
      results = await analyzeAll(truncatedContent, additionalContext);
    } else {
      const result = await analyzeContent(
        truncatedContent,
        type as AnalysisType,
        additionalContext
      );
      results = [result];
    }

    // Delete existing analyses of the same type for this project
    if (type === "all") {
      await db.delete(schema.analyses).where(eq(schema.analyses.projectId, projectId));
    } else {
      const existingAnalyses = await db
        .select()
        .from(schema.analyses)
        .where(eq(schema.analyses.projectId, projectId));

      for (const existing of existingAnalyses) {
        if (existing.type === type) {
          await db.delete(schema.analyses).where(eq(schema.analyses.id, existing.id));
        }
      }
    }

    // Store analysis results
    const analysisRecords = results
      .filter((r) => r.success)
      .map((result) => ({
        id: uuidv4(),
        projectId,
        type: result.type as "marketing" | "techstack" | "architecture" | "performance" | "recommendations",
        content: result.content,
        createdAt: new Date(),
      }));

    if (analysisRecords.length > 0) {
      await db.insert(schema.analyses).values(analysisRecords);
    }

    // Update status to complete
    await db
      .update(schema.projects)
      .set({ status: "complete", updatedAt: new Date() })
      .where(eq(schema.projects.id, projectId));

    const errors = results.filter((r) => !r.success);

    return NextResponse.json({
      success: true,
      analysesCompleted: analysisRecords.length,
      analyses: analysisRecords,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    await logError({ route: "/api/analyze", method: "POST", error });
    return NextResponse.json(
      { error: "Failed to analyze content" },
      { status: 500 }
    );
  }
}
