import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { captureFullPageScreenshot } from "@/lib/firecrawl";
import { compressScreenshot } from "@/lib/screenshot-compress";
import { logError } from "@/lib/error-logger";

// Capture a full-page screenshot for the page
export async function POST(
  request: NextRequest,
  { params }: { params: { pageId: string } }
) {
  try {
    const { pageId } = params;

    // Get the page
    const page = await db
      .select()
      .from(schema.pages)
      .where(eq(schema.pages.id, pageId))
      .limit(1);

    if (page.length === 0) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const pageUrl = page[0].url;

    // Capture full-page screenshot
    const screenshot = await captureFullPageScreenshot(pageUrl);

    if (!screenshot) {
      return NextResponse.json(
        { error: "Failed to capture full-page screenshot" },
        { status: 500 }
      );
    }

    // Compress and update the page with the full-page screenshot
    const compressedScreenshot = await compressScreenshot(screenshot);

    await db
      .update(schema.pages)
      .set({
        fullPageScreenshot: compressedScreenshot,
      })
      .where(eq(schema.pages.id, pageId));

    return NextResponse.json({
      success: true,
      fullPageScreenshot: compressedScreenshot,
    });
  } catch (error) {
    await logError({ route: "/api/pages/[pageId]/screenshot", method: "POST", error });
    return NextResponse.json(
      { error: "Failed to capture full-page screenshot" },
      { status: 500 }
    );
  }
}
