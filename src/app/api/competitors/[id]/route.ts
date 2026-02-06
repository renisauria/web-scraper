import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { captureViewportScreenshot } from "@/lib/firecrawl";

const updateCompetitorSchema = z.object({
  name: z.string().min(1).optional(),
  url: z.string().url().optional(),
  type: z.enum(["competitor", "inspiration"]).optional(),
  preferredFeature: z.string().optional(),
  preferredFeatureUrl: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
  referenceImages: z.array(z.string()).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const existing = await db
      .select()
      .from(schema.competitors)
      .where(eq(schema.competitors.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Competitor not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const data = updateCompetitorSchema.parse(body);

    const updates: Record<string, unknown> = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.url !== undefined) updates.url = data.url;
    if (data.type !== undefined) updates.type = data.type;
    if (data.preferredFeature !== undefined) updates.preferredFeature = data.preferredFeature || null;
    if (data.preferredFeatureUrl !== undefined) updates.preferredFeatureUrl = data.preferredFeatureUrl || null;
    if (data.notes !== undefined) updates.notes = data.notes || null;
    if (data.referenceImages !== undefined) updates.referenceImages = data.referenceImages;

    if (Object.keys(updates).length > 0) {
      await db
        .update(schema.competitors)
        .set(updates)
        .where(eq(schema.competitors.id, id));
    }

    const updated = await db
      .select()
      .from(schema.competitors)
      .where(eq(schema.competitors.id, id))
      .limit(1);

    return NextResponse.json({ competitor: updated[0] });
  } catch (error) {
    console.error("Error updating competitor:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update competitor" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const existing = await db
      .select()
      .from(schema.competitors)
      .where(eq(schema.competitors.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Competitor not found" },
        { status: 404 }
      );
    }

    const competitor = existing[0];
    const screenshot = await captureViewportScreenshot(competitor.url);

    await db
      .update(schema.competitors)
      .set({ screenshot })
      .where(eq(schema.competitors.id, id));

    const updated = await db
      .select()
      .from(schema.competitors)
      .where(eq(schema.competitors.id, id))
      .limit(1);

    return NextResponse.json({ competitor: updated[0] });
  } catch (error) {
    console.error("Error recapturing competitor screenshot:", error);
    return NextResponse.json(
      { error: "Failed to recapture screenshot" },
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
      .from(schema.competitors)
      .where(eq(schema.competitors.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Competitor not found" },
        { status: 404 }
      );
    }

    await db
      .delete(schema.competitors)
      .where(eq(schema.competitors.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting competitor:", error);
    return NextResponse.json(
      { error: "Failed to delete competitor" },
      { status: 500 }
    );
  }
}
