import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { captureViewportScreenshot } from "@/lib/firecrawl";
import { compressScreenshot } from "@/lib/screenshot-compress";
import { logError } from "@/lib/error-logger";

const createCompetitorSchema = z.object({
  projectId: z.string().uuid("Valid project ID is required"),
  name: z.string().min(1, "Name is required"),
  url: z.string().url("Valid URL is required"),
  type: z.enum(["competitor", "inspiration"]).default("competitor"),
  preferredFeature: z.string().optional(),
  preferredFeatureUrl: z.string().url("Valid URL is required").optional().or(z.literal("")),
  referenceImages: z.array(z.object({
    url: z.string(),
    tag: z.enum(["emulate", "avoid"]).nullable(),
  })).optional(),
  screenshotLabel: z.enum(["good", "bad"]).nullable().optional(),
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
    await logError({ route: "/api/competitors", method: "GET", error });
    return NextResponse.json(
      { error: "Failed to fetch competitors" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, name, url, type, preferredFeature, preferredFeatureUrl, referenceImages, screenshotLabel, notes } = createCompetitorSchema.parse(body);

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

    // Capture and compress viewport screenshot
    const rawScreenshot = await captureViewportScreenshot(url);
    const screenshot = await compressScreenshot(rawScreenshot);

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
      screenshotLabel: screenshotLabel || null,
      notes: notes || null,
    });

    const created = await db
      .select()
      .from(schema.competitors)
      .where(eq(schema.competitors.id, id))
      .limit(1);

    return NextResponse.json({ competitor: created[0] }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    await logError({ route: "/api/competitors", method: "POST", error });
    return NextResponse.json(
      { error: "Failed to create competitor" },
      { status: 500 }
    );
  }
}
