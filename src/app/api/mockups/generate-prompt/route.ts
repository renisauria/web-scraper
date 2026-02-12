import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { generateMockupPrompt } from "@/lib/anthropic";
import { parseDesignTokens, formatTokensForPrompt } from "@/lib/design-tokens";
import { formatProductsForPrompt } from "@/lib/product-formatter";
import { logError } from "@/lib/error-logger";
import { normalizeReferenceImages } from "@/types";
import type { Project, Analysis, Competitor, Product } from "@/types";

const generatePromptSchema = z.object({
  projectId: z.string().min(1),
  style: z.string().min(1),
  pageType: z.string().min(1),
  aspectRatio: z.string().optional(),
  customInstructions: z.string().optional(),
  selectedProductIds: z.array(z.string()).optional(),
  selectedProductImageCount: z.number().int().min(0).optional(),
  hasLogo: z.boolean().optional(),
  hasPrimaryReference: z.boolean().optional(),
  referenceImageCount: z.number().int().min(0).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, style, pageType, aspectRatio, customInstructions, selectedProductIds, selectedProductImageCount, hasPrimaryReference, referenceImageCount } =
      generatePromptSchema.parse(body);

    // Fetch project
    const projectRows = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, projectId))
      .limit(1);

    if (projectRows.length === 0) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const project = projectRows[0] as unknown as Project;

    // Fetch analyses and competitors
    const analyses = (await db
      .select()
      .from(schema.analyses)
      .where(
        eq(schema.analyses.projectId, projectId)
      )) as unknown as Analysis[];

    const rawCompetitors = (await db
      .select()
      .from(schema.competitors)
      .where(
        eq(schema.competitors.projectId, projectId)
      )) as unknown as Competitor[];

    // Normalize legacy string[] referenceImages to ReferenceImage[]
    const competitors = rawCompetitors.map(c => ({
      ...c,
      referenceImages: normalizeReferenceImages(c.referenceImages),
    }));

    // Fetch design kit for the project and format tokens for prompt
    let designTokensContext: string | undefined;
    const designKits = await db
      .select()
      .from(schema.designKits)
      .where(eq(schema.designKits.projectId, projectId));

    if (designKits.length > 0 && designKits[0].tokens) {
      let tokens = designKits[0].tokens as Record<string, unknown>;
      if (typeof tokens === "string") {
        try { tokens = JSON.parse(tokens); } catch { tokens = {}; }
      }
      const flat = parseDesignTokens(tokens);
      if (flat.length > 0) {
        designTokensContext = formatTokensForPrompt(flat);
      }
    }

    // Fetch selected products and format for prompt
    let productContext: string | undefined;
    if (selectedProductIds && selectedProductIds.length > 0) {
      const selectedProducts = await db
        .select()
        .from(schema.products)
        .where(inArray(schema.products.id, selectedProductIds));

      if (selectedProducts.length > 0) {
        productContext = formatProductsForPrompt(selectedProducts as unknown as Product[]);
      }
    }

    // Generate the prompt via Claude
    const result = await generateMockupPrompt(project, analyses, competitors, {
      style,
      pageType,
      aspectRatio,
      customInstructions: customInstructions || undefined,
      designTokensContext,
      productContext,
      hasPrimaryReference,
      referenceImageCount,
      hasLogo: !!project.logo,
      selectedProductImageCount,
    });

    return NextResponse.json({ prompt: result.prompt });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    await logError({ route: "/api/mockups/generate-prompt", method: "POST", error });
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate prompt",
      },
      { status: 500 }
    );
  }
}
