import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const existing = await db
      .select()
      .from(schema.mockups)
      .where(eq(schema.mockups.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Mockup not found" }, { status: 404 });
    }

    await db.delete(schema.mockups).where(eq(schema.mockups.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting mockup:", error);
    return NextResponse.json(
      { error: "Failed to delete mockup" },
      { status: 500 }
    );
  }
}
