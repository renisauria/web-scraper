import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { extractProductsFromContent } from "@/lib/anthropic";
import { logError } from "@/lib/error-logger";

const extractSchema = z.object({
  pageId: z.string().min(1, "Page ID is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pageId } = extractSchema.parse(body);

    // Fetch the page
    const pageRows = await db
      .select()
      .from(schema.pages)
      .where(eq(schema.pages.id, pageId))
      .limit(1);

    if (pageRows.length === 0) {
      return NextResponse.json(
        { error: "Page not found" },
        { status: 404 }
      );
    }

    const page = pageRows[0];

    if (!page.content) {
      return NextResponse.json(
        { error: "Page has no content to extract products from" },
        { status: 400 }
      );
    }

    // Extract products using Claude
    const result = await extractProductsFromContent(page.content, page.url);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Product extraction failed" },
        { status: 500 }
      );
    }

    if (result.pageType === "no_products" || result.products.length === 0) {
      return NextResponse.json({
        products: [],
        extractedCount: 0,
        pageType: result.pageType,
      });
    }

    // Delete existing products for this page (upsert pattern)
    await db
      .delete(schema.products)
      .where(eq(schema.products.pageId, pageId));

    // Insert extracted products
    const now = new Date();
    const insertedProducts = [];

    for (const extracted of result.products) {
      const product = {
        id: uuidv4(),
        projectId: page.projectId,
        pageId: pageId,
        name: extracted.name,
        description: extracted.description,
        price: extracted.price,
        currency: extracted.currency,
        variants: extracted.variants,
        specifications: extracted.specifications,
        images: extracted.images,
        category: extracted.category,
        brand: extracted.brand,
        sku: extracted.sku,
        availability: extracted.availability,
        rawExtraction: extracted as unknown as Record<string, unknown>,
        createdAt: now,
        updatedAt: now,
      };

      await db.insert(schema.products).values(product);
      insertedProducts.push(product);
    }

    return NextResponse.json({
      products: insertedProducts,
      extractedCount: insertedProducts.length,
      pageType: result.pageType,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    await logError({ route: "/api/products/extract", method: "POST", error });
    return NextResponse.json(
      { error: "Failed to extract products" },
      { status: 500 }
    );
  }
}
