import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { parseDesignTokens } from "@/lib/design-tokens";

const createDesignKitSchema = z.object({
  projectId: z.string().min(1, "projectId is required"),
  fileName: z.string().min(1, "fileName is required"),
  tokensJson: z.string().min(1, "tokensJson is required"),
});

export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    const kits = await db
      .select()
      .from(schema.designKits)
      .where(eq(schema.designKits.projectId, projectId));

    return NextResponse.json({ designKit: kits[0] || null });
  } catch (error) {
    console.error("Error fetching design kits:", error);
    return NextResponse.json(
      { error: "Failed to fetch design kits" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, fileName, tokensJson } =
      createDesignKitSchema.parse(body);

    // Parse and validate the tokens JSON
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(tokensJson);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in tokensJson" },
        { status: 400 }
      );
    }

    // Validate by running the parser (will throw if structure is completely wrong)
    const flat = parseDesignTokens(parsed);
    if (flat.length === 0) {
      return NextResponse.json(
        { error: "No design tokens found in the file. Ensure it follows the W3C DTCG format with $value entries." },
        { status: 400 }
      );
    }

    // Verify project exists
    const project = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, projectId))
      .limit(1);

    if (project.length === 0) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Upsert: delete existing kit for this project, then insert new one
    await db
      .delete(schema.designKits)
      .where(eq(schema.designKits.projectId, projectId));

    const id = uuidv4();
    await db.insert(schema.designKits).values({
      id,
      projectId,
      fileName,
      tokens: parsed,
    });

    const created = await db
      .select()
      .from(schema.designKits)
      .where(eq(schema.designKits.id, id))
      .limit(1);

    return NextResponse.json({ designKit: created[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating design kit:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create design kit" },
      { status: 500 }
    );
  }
}
