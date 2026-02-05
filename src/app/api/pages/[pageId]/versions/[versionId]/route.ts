import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: { pageId: string; versionId: string } }
) {
  try {
    const { pageId, versionId } = params;

    // Get the version
    const version = await db
      .select()
      .from(schema.pageVersions)
      .where(eq(schema.pageVersions.id, versionId))
      .limit(1);

    if (version.length === 0) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    // Verify it belongs to the correct page
    if (version[0].pageId !== pageId) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    // Get the page for context
    const page = await db
      .select()
      .from(schema.pages)
      .where(eq(schema.pages.id, pageId))
      .limit(1);

    // Get the project info
    const project = page.length > 0
      ? await db
          .select()
          .from(schema.projects)
          .where(eq(schema.projects.id, page[0].projectId))
          .limit(1)
      : [];

    return NextResponse.json({
      version: version[0],
      page: page[0] || null,
      project: project[0] || null,
    });
  } catch (error) {
    console.error("Error fetching version:", error);
    return NextResponse.json(
      { error: "Failed to fetch version" },
      { status: 500 }
    );
  }
}

// Delete a specific version
export async function DELETE(
  request: NextRequest,
  { params }: { params: { pageId: string; versionId: string } }
) {
  try {
    const { pageId, versionId } = params;

    // Get the version to verify it exists and belongs to the page
    const version = await db
      .select()
      .from(schema.pageVersions)
      .where(eq(schema.pageVersions.id, versionId))
      .limit(1);

    if (version.length === 0) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    if (version[0].pageId !== pageId) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    // Delete the version
    await db
      .delete(schema.pageVersions)
      .where(eq(schema.pageVersions.id, versionId));

    return NextResponse.json({
      success: true,
      message: "Version deleted",
    });
  } catch (error) {
    console.error("Error deleting version:", error);
    return NextResponse.json(
      { error: "Failed to delete version" },
      { status: 500 }
    );
  }
}
