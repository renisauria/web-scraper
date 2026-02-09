import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

const createSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1),
  prompt: z.string().min(1),
  style: z.string().optional(),
  pageType: z.string().optional(),
});

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

    const prompts = await db
      .select()
      .from(schema.savedPrompts)
      .where(eq(schema.savedPrompts.projectId, projectId))
      .orderBy(desc(schema.savedPrompts.updatedAt));

    return NextResponse.json({ savedPrompts: prompts });
  } catch (error) {
    console.error("Error fetching saved prompts:", error);
    return NextResponse.json(
      { error: "Failed to fetch saved prompts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, name, prompt, style, pageType } = createSchema.parse(body);

    // Verify project exists
    const projectRows = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, projectId))
      .limit(1);

    if (projectRows.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const id = uuidv4();
    await db.insert(schema.savedPrompts).values({
      id,
      projectId,
      name,
      prompt,
      style: style || null,
      pageType: pageType || null,
    });

    const saved = await db
      .select()
      .from(schema.savedPrompts)
      .where(eq(schema.savedPrompts.id, id))
      .limit(1);

    return NextResponse.json({ savedPrompt: saved[0] });
  } catch (error) {
    console.error("Error saving prompt:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to save prompt" },
      { status: 500 }
    );
  }
}
