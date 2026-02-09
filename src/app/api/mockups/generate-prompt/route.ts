import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { generateMockupPrompt } from "@/lib/openai";
import type { Project, Analysis, Competitor } from "@/types";

const generatePromptSchema = z.object({
  projectId: z.string().min(1),
  style: z.string().min(1),
  pageType: z.string().min(1),
  customInstructions: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, style, pageType, customInstructions } =
      generatePromptSchema.parse(body);

    // Fetch project
    const projectRows = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, projectId))
      .limit(1);

    if (projectRows.length === 0) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const project = projectRows[0] as unknown as Project;

    // Fetch analyses and competitors
    const analyses = (await db
      .select()
      .from(schema.analyses)
      .where(
        eq(schema.analyses.projectId, projectId)
      )) as unknown as Analysis[];

    const competitors = (await db
      .select()
      .from(schema.competitors)
      .where(
        eq(schema.competitors.projectId, projectId)
      )) as unknown as Competitor[];

    // Generate the prompt via GPT-4
    const result = await generateMockupPrompt(project, analyses, competitors, {
      style,
      pageType,
      customInstructions: customInstructions || undefined,
    });

    return NextResponse.json({ prompt: result.prompt });
  } catch (error) {
    console.error("Error generating mockup prompt:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate prompt",
      },
      { status: 500 }
    );
  }
}
