import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  url: z.string().url().optional(),
  clientName: z.string().optional(),
  clientProblems: z.string().optional(),
  clientGoals: z.string().optional(),
  status: z.enum(["pending", "scraping", "scraped", "analyzing", "complete", "error"]).optional(),
});

export async function GET(
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

    const analyses = await db
      .select()
      .from(schema.analyses)
      .where(eq(schema.analyses.projectId, id));

    const competitors = await db
      .select()
      .from(schema.competitors)
      .where(eq(schema.competitors.projectId, id));

    return NextResponse.json({
      project: project[0],
      pages,
      analyses,
      competitors,
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const validatedData = updateProjectSchema.parse(body);

    const existing = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await db
      .update(schema.projects)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(schema.projects.id, id));

    const updated = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, id))
      .limit(1);

    return NextResponse.json({ project: updated[0] });
  } catch (error) {
    console.error("Error updating project:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const existing = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await db.delete(schema.projects).where(eq(schema.projects.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
