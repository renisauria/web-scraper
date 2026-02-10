import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { logError } from "@/lib/error-logger";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  prompt: z.string().min(1).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const validatedData = updateSchema.parse(body);

    const existing = await db
      .select()
      .from(schema.savedPrompts)
      .where(eq(schema.savedPrompts.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Saved prompt not found" },
        { status: 404 }
      );
    }

    await db
      .update(schema.savedPrompts)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(schema.savedPrompts.id, id));

    const updated = await db
      .select()
      .from(schema.savedPrompts)
      .where(eq(schema.savedPrompts.id, id))
      .limit(1);

    return NextResponse.json({ savedPrompt: updated[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    await logError({ route: "/api/saved-prompts/[id]", method: "PATCH", error });
    return NextResponse.json(
      { error: "Failed to update saved prompt" },
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
      .from(schema.savedPrompts)
      .where(eq(schema.savedPrompts.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Saved prompt not found" },
        { status: 404 }
      );
    }

    await db.delete(schema.savedPrompts).where(eq(schema.savedPrompts.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    await logError({ route: "/api/saved-prompts/[id]", method: "DELETE", error });
    return NextResponse.json(
      { error: "Failed to delete saved prompt" },
      { status: 500 }
    );
  }
}
