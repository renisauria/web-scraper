import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { generateMockup } from "@/lib/gemini";
import type { Competitor } from "@/types";

export const maxDuration = 120;

const generateSchema = z.object({
  projectId: z.string().min(1),
  prompt: z.string().min(1),
  label: z.string().optional(),
  style: z.string().optional(),
  extraReferenceImages: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, prompt, label, style, extraReferenceImages } = generateSchema.parse(body);

    // Verify project exists
    const projectRows = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, projectId))
      .limit(1);

    if (projectRows.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Collect reference images from competitors (screenshots + reference images)
    const competitors = (await db
      .select()
      .from(schema.competitors)
      .where(eq(schema.competitors.projectId, projectId))) as unknown as Competitor[];

    const referenceImages: string[] = [];

    // Add user-uploaded visual references first (highest priority)
    if (extraReferenceImages) {
      referenceImages.push(...extraReferenceImages);
    }

    // Fill remaining slots with competitor images
    for (const comp of competitors) {
      if (referenceImages.length >= 5) break;
      if (comp.screenshot) {
        referenceImages.push(comp.screenshot);
      }
      if (comp.referenceImages) {
        referenceImages.push(...comp.referenceImages);
      }
    }

    // Generate mockup using the prompt directly
    const result = await generateMockup(
      prompt,
      referenceImages.length > 0 ? referenceImages.slice(0, 5) : undefined
    );

    // Save to DB
    const mockupId = uuidv4();
    await db.insert(schema.mockups).values({
      id: mockupId,
      projectId,
      prompt,
      image: result.image,
      label: label || null,
      style: style || null,
    });

    // Fetch the saved mockup
    const savedMockup = await db
      .select()
      .from(schema.mockups)
      .where(eq(schema.mockups.id, mockupId))
      .limit(1);

    return NextResponse.json({ mockup: savedMockup[0] });
  } catch (error) {
    console.error("Error generating mockup:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    const errorMessage = error instanceof Error ? error.message : "Failed to generate mockup";
    console.error("Mockup error details:", errorMessage);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
