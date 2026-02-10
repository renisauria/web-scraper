import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { logError } from "@/lib/error-logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId query parameter is required" },
        { status: 400 }
      );
    }

    const products = await db
      .select()
      .from(schema.products)
      .where(eq(schema.products.projectId, projectId))
      .orderBy(desc(schema.products.createdAt));

    return NextResponse.json({ products });
  } catch (error) {
    await logError({ route: "/api/products", method: "GET", error });
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
