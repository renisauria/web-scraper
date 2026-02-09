import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export async function generateMockupPrompt(
  project: {
    name: string;
    url: string;
    clientProblems?: string | null;
    competitorAnalysis?: string | null;
    projectRequirements?: string | null;
    clientNotes?: string | null;
  },
  analyses: { type: string; content: Record<string, unknown> | null }[],
  competitors: { name: string; url: string; notes?: string | null }[],
  options: { style: string; pageType: string; customInstructions?: string; designTokensContext?: string }
): Promise<{ prompt: string }> {
  const systemPrompt = `You are an elite prompt engineer specializing in crafting image-generation prompts for AI models like Google Gemini Imagen. Your job is to take project context and produce a single, hyper-detailed image prompt that will generate a stunning, realistic website mockup screenshot.

RULES FOR THE PROMPT YOU WRITE:
1. USE CONCRETE VISUAL LANGUAGE ONLY — never say "professional feel" or "modern look". Instead say "navy blue navigation bar with white 14px sans-serif text, left-aligned logo, right-aligned menu links spaced 32px apart".
2. SPECIFY EXACT LAYOUT — describe sections top-to-bottom: navigation, hero, features grid, testimonials, CTA banner, footer. State grid structures (e.g. "3-column card grid with 24px gaps").
3. INCLUDE COLOR PALETTE — use hex codes. E.g. "primary: #1a1a2e, accent: #e94560, background: #f5f5f5, text: #333333".
4. DESCRIBE TYPOGRAPHY — mention weight (bold, semibold, regular), style (sans-serif, serif), and relative sizes (e.g. "hero headline 48px bold sans-serif, subheadline 20px regular").
5. NAME SPECIFIC UI COMPONENTS — hero section, sticky navbar, product cards, testimonial carousel, CTA buttons with rounded corners, icon grid, trust badges, newsletter signup, multi-column footer with social icons.
6. SPECIFY FRAMING — "Desktop browser screenshot at 1440px width, shown in a clean browser chrome frame" or "Full-page website screenshot without browser chrome".
7. INCLUDE NEGATIVE GUIDANCE — "Not a wireframe. Not a low-fidelity sketch. No lorem ipsum placeholder text — use realistic English copy. No watermarks. No UI kit component sheets."
8. ANCHOR QUALITY — "Awwwards-quality design. Behance featured project level. Pixel-perfect rendering."
9. INCLUDE REALISTIC CONTENT — suggest actual headline text, button labels, and section copy that match the brand.
10. USE PROVIDED DESIGN TOKENS — if design tokens are provided, use the exact hex codes, font names, and spacing values from those tokens. Do not invent new colors or fonts when tokens are available.

Return ONLY the complete image-generation prompt as plain text (no JSON wrapper, no markdown, no explanation). The prompt should be 400-800 words.`;

  // Assemble all project context
  const contextParts: string[] = [];
  contextParts.push(`Website: "${project.name}" (${project.url})`);
  contextParts.push(`Design Style: ${options.style}`);
  contextParts.push(`Page Type: ${options.pageType}`);

  if (project.clientProblems) {
    contextParts.push(
      `Client Problems:\n${project.clientProblems.slice(0, 2000)}`
    );
  }
  if (project.competitorAnalysis) {
    contextParts.push(
      `Competitor Analysis & Desired Features:\n${project.competitorAnalysis.slice(0, 2000)}`
    );
  }
  if (project.projectRequirements) {
    contextParts.push(
      `Project Requirements:\n${project.projectRequirements.slice(0, 2000)}`
    );
  }
  if (project.clientNotes) {
    contextParts.push(
      `Client Notes:\n${project.clientNotes.slice(0, 1000)}`
    );
  }

  // Add analysis summaries
  for (const analysis of analyses) {
    const content = analysis.content;
    if (!content) continue;
    const summary =
      (content.summary as string) || (content.overview as string);
    if (summary) {
      contextParts.push(
        `${analysis.type} analysis insight: ${summary.slice(0, 300)}`
      );
    }
  }

  // Add competitor context
  const competitorNames = competitors
    .map((c) => `${c.name} (${c.url})`)
    .slice(0, 5);
  if (competitorNames.length > 0) {
    contextParts.push(
      `Competitor/inspiration sites: ${competitorNames.join(", ")}`
    );
  }
  const competitorNotes = competitors
    .filter((c) => c.notes)
    .map((c) => `${c.name}: ${c.notes!.slice(0, 150)}`)
    .slice(0, 3);
  if (competitorNotes.length > 0) {
    contextParts.push(`Competitor notes: ${competitorNotes.join("; ")}`);
  }

  if (options.designTokensContext) {
    contextParts.push(`Design Tokens (use these exact values):\n${options.designTokensContext}`);
  }

  if (options.customInstructions) {
    contextParts.push(`Custom Instructions: ${options.customInstructions}`);
  }

  const userPrompt = `Based on the following project context, craft the perfect image-generation prompt for a ${options.pageType} mockup in the "${options.style}" style.\n\n${contextParts.join("\n\n")}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2000,
      temperature: 0.8,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }

    return { prompt: textBlock.text };
  } catch (error: unknown) {
    console.error("Claude mockup prompt generation error:", error);
    if (error && typeof error === "object" && "status" in error && (error as { status: number }).status === 400) {
      const msg = (error as { message?: string }).message || "";
      if (msg.includes("credit balance")) {
        throw new Error("Anthropic API credit balance is too low. Please add credits at console.anthropic.com.");
      }
    }
    throw error;
  }
}
