import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 100, 1000);

    const logs = await db
      .select()
      .from(schema.errorLogs)
      .orderBy(desc(schema.errorLogs.createdAt))
      .limit(limit);

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Error fetching error logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch error logs" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await db.delete(schema.errorLogs);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing error logs:", error);
    return NextResponse.json(
      { error: "Failed to clear error logs" },
      { status: 500 }
    );
  }
}
