import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { logError } from "@/lib/error-logger";

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  url: z.string().url().optional(),
  clientName: z.string().optional(),
  clientProblems: z.string().optional(),
  competitorAnalysis: z.string().optional(),
  projectRequirements: z.string().optional(),
  clientNotes: z.string().optional(),
  logo: z.string().nullable().optional(),
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

    const [pages, analyses, competitors, mockups, savedPrompts, products] = await Promise.all([
      db.select().from(schema.pages).where(eq(schema.pages.projectId, id)),
      db.select().from(schema.analyses).where(eq(schema.analyses.projectId, id)),
      db.select().from(schema.competitors).where(eq(schema.competitors.projectId, id)),
      db.select().from(schema.mockups).where(eq(schema.mockups.projectId, id)),
      db.select().from(schema.savedPrompts).where(eq(schema.savedPrompts.projectId, id)),
      db.select().from(schema.products).where(eq(schema.products.projectId, id)),
    ]);

    return NextResponse.json({
      project: project[0],
      pages,
      analyses,
      competitors,
      mockups,
      savedPrompts,
      products,
    });
  } catch (error) {
    await logError({ route: "/api/projects/[id]", method: "GET", error });
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

    const contextFields = ["clientProblems", "competitorAnalysis", "projectRequirements", "clientNotes"];
    const isContextUpdate = contextFields.some((f) => f in validatedData);

    await db
      .update(schema.projects)
      .set({
        ...validatedData,
        updatedAt: new Date(),
        ...(isContextUpdate ? { contextUpdatedAt: new Date() } : {}),
      })
      .where(eq(schema.projects.id, id));

    const updated = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, id))
      .limit(1);

    return NextResponse.json({ project: updated[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    await logError({ route: "/api/projects/[id]", method: "PATCH", error });
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
    await logError({ route: "/api/projects/[id]", method: "DELETE", error });
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
