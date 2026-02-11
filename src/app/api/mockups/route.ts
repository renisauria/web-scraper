import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { generateMockup } from "@/lib/gemini";
import { compressScreenshot } from "@/lib/screenshot-compress";
import { logError } from "@/lib/error-logger";
import { normalizeReferenceImages } from "@/types";
import type { Competitor } from "@/types";

export const maxDuration = 120;

const generateSchema = z.object({
  projectId: z.string().min(1),
  prompt: z.string().min(1),
  label: z.string().optional(),
  style: z.string().optional(),
  extraReferenceImages: z.array(z.string()).optional(),
  primaryReferenceImageIndex: z.number().int().min(0).optional(),
  originalPrompt: z.string().optional(),
  customInstructions: z.string().optional(),
  styleRef: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, prompt, label, style, extraReferenceImages, primaryReferenceImageIndex, originalPrompt, customInstructions, styleRef } = generateSchema.parse(body);

    // Verify project exists
    const projectRows = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, projectId))
      .limit(1);

    if (projectRows.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Collect reference images from competitors, grouped by tag
    const competitors = (await db
      .select()
      .from(schema.competitors)
      .where(eq(schema.competitors.projectId, projectId))) as unknown as Competitor[];

    const goodReferenceImages: string[] = [];
    const badReferenceImages: string[] = [];

    // Extract primary reference image from user uploads (if specified)
    let primaryImage: string | undefined;
    if (extraReferenceImages && primaryReferenceImageIndex !== undefined && primaryReferenceImageIndex < extraReferenceImages.length) {
      primaryImage = extraReferenceImages[primaryReferenceImageIndex];
      // Add remaining user uploads (excluding primary) as positive references
      for (let i = 0; i < extraReferenceImages.length; i++) {
        if (i !== primaryReferenceImageIndex) {
          goodReferenceImages.push(extraReferenceImages[i]);
        }
      }
    } else if (extraReferenceImages) {
      // No primary selected — all user uploads go into positive references
      goodReferenceImages.push(...extraReferenceImages);
    }

    // Group competitor images: auto-captured screenshot uses competitor-level label,
    // user-uploaded reference images use their individual per-image tags
    for (const comp of competitors) {
      // Auto-captured screenshot uses competitor-level screenshotLabel
      if (comp.screenshot) {
        if (comp.screenshotLabel === "bad") {
          badReferenceImages.push(comp.screenshot);
        } else {
          goodReferenceImages.push(comp.screenshot);
        }
      }

      // Per-image tagged reference images
      const refImages = normalizeReferenceImages(comp.referenceImages);
      for (const img of refImages) {
        if (img.tag === "avoid") {
          badReferenceImages.push(img.url);
        } else {
          // "emulate" + untagged → positive references
          goodReferenceImages.push(img.url);
        }
      }
    }

    // Generate mockup using the prompt directly
    const result = await generateMockup(
      prompt,
      goodReferenceImages.length > 0 ? goodReferenceImages.slice(0, 5) : undefined,
      badReferenceImages.length > 0 ? badReferenceImages.slice(0, 3) : undefined,
      primaryImage
    );

    // Compress mockup image to WebP
    const compressedImage = (await compressScreenshot(result.image)) ?? result.image;

    // Save to DB
    const mockupId = uuidv4();
    await db.insert(schema.mockups).values({
      id: mockupId,
      projectId,
      prompt,
      image: compressedImage,
      label: label || null,
      style: style || null,
      originalPrompt: originalPrompt || null,
      customInstructions: customInstructions || null,
      styleRef: styleRef || null,
    });

    // Fetch the saved mockup
    const savedMockup = await db
      .select()
      .from(schema.mockups)
      .where(eq(schema.mockups.id, mockupId))
      .limit(1);

    return NextResponse.json({ mockup: savedMockup[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    await logError({ route: "/api/mockups", method: "POST", error });
    const errorMessage = error instanceof Error ? error.message : "Failed to generate mockup";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
