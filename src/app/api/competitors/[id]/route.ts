import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { captureViewportScreenshot } from "@/lib/firecrawl";

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
