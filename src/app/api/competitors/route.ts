import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { captureViewportScreenshot } from "@/lib/firecrawl";

const createCompetitorSchema = z.object({
  projectId: z.string().uuid("Valid project ID is required"),
  name: z.string().min(1, "Name is required"),
  url: z.string().url("Valid URL is required"),
  type: z.enum(["competitor", "inspiration"]).default("competitor"),
  preferredFeature: z.string().optional(),
  preferredFeatureUrl: z.string().url("Valid URL is required").optional().or(z.literal("")),
  referenceImages: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    const competitors = await db
      .select()
      .from(schema.competitors)
      .where(eq(schema.competitors.projectId, projectId));

    return NextResponse.json({ competitors });
  } catch (error) {
    console.error("Error fetching competitors:", error);
    return NextResponse.json(
      { error: "Failed to fetch competitors" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, name, url, type, preferredFeature, preferredFeatureUrl, referenceImages, notes } = createCompetitorSchema.parse(body);

    // Verify project exists
    const project = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, projectId))
      .limit(1);

    if (project.length === 0) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Capture viewport screenshot
    const screenshot = await captureViewportScreenshot(url);

    const id = uuidv4();
    await db.insert(schema.competitors).values({
      id,
      projectId,
      name,
      url,
      type,
      preferredFeature: preferredFeature || null,
      preferredFeatureUrl: preferredFeatureUrl || null,
      screenshot,
      referenceImages: referenceImages?.length ? referenceImages : null,
      notes: notes || null,
    });

    const created = await db
      .select()
      .from(schema.competitors)
      .where(eq(schema.competitors.id, id))
      .limit(1);

    return NextResponse.json({ competitor: created[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating competitor:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create competitor" },
      { status: 500 }
    );
  }
}
