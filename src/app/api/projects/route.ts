import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { logError } from "@/lib/error-logger";

const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.string().url("Valid URL is required"),
  clientName: z.string().optional(),
  clientProblems: z.string().optional(),
  competitorAnalysis: z.string().optional(),
});

export async function GET() {
  try {
    const projects = await db
      .select()
      .from(schema.projects)
      .orderBy(desc(schema.projects.createdAt));

    return NextResponse.json({ projects });
  } catch (error) {
    await logError({ route: "/api/projects", method: "GET", error });
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createProjectSchema.parse(body);

    const project = {
      id: uuidv4(),
      name: validatedData.name,
      url: validatedData.url,
      clientName: validatedData.clientName || null,
      clientProblems: validatedData.clientProblems || null,
      competitorAnalysis: validatedData.competitorAnalysis || null,
      status: "pending" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(schema.projects).values(project);

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    await logError({ route: "/api/projects", method: "POST", error });
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
