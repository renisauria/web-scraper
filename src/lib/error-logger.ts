import { db, schema } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

interface LogErrorParams {
  route: string;
  method: string;
  error: unknown;
  context?: Record<string, unknown>;
}

export async function logError({ route, method, error, context }: LogErrorParams) {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack ?? null : null;

  // Preserve terminal output
  console.error(`[${method}] ${route}:`, error);

  try {
    await db.insert(schema.errorLogs).values({
      id: uuidv4(),
      route,
      method,
      message,
      stack,
      context: context ?? null,
    });
  } catch (insertError) {
    // Fallback: don't let logging failures break the app
    console.error("Failed to persist error log:", insertError);
  }
}
