import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { updateTokenValue } from "@/lib/design-tokens";

const patchSchema = z.object({
  path: z.string().min(1, "Token path is required"),
  value: z.unknown(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { path, value } = patchSchema.parse(body);

    const existing = await db
      .select()
      .from(schema.designKits)
      .where(eq(schema.designKits.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Design kit not found" },
        { status: 404 }
      );
    }

    const kit = existing[0];
    let tokens = kit.tokens as Record<string, unknown> | null;
    if (typeof tokens === "string") {
      try { tokens = JSON.parse(tokens); } catch { tokens = null; }
    }
    if (!tokens) {
      return NextResponse.json(
        { error: "Design kit has no tokens" },
        { status: 400 }
      );
    }

    const updatedTokens = updateTokenValue(tokens, path, value);

    await db
      .update(schema.designKits)
      .set({
        tokens: updatedTokens,
        updatedAt: new Date(),
      })
      .where(eq(schema.designKits.id, id));

    const updated = await db
      .select()
      .from(schema.designKits)
      .where(eq(schema.designKits.id, id))
      .limit(1);

    return NextResponse.json({ designKit: updated[0] });
  } catch (error) {
    console.error("Error updating design kit:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update design kit" },
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
      .from(schema.designKits)
      .where(eq(schema.designKits.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Design kit not found" },
        { status: 404 }
      );
    }

    await db.delete(schema.designKits).where(eq(schema.designKits.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting design kit:", error);
    return NextResponse.json(
      { error: "Failed to delete design kit" },
      { status: 500 }
    );
  }
}
