import { GoogleGenAI } from "@google/genai";
import type { Project, Analysis, Competitor } from "@/types";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_AI_API_KEY!,
});

export function buildMockupPrompt(
  project: Project,
  analyses: Analysis[],
  competitors: Competitor[],
  options: { label?: string; style?: string; customPrompt?: string }
): string {
  const parts: string[] = [];

  parts.push(
    `Generate a professional, high-fidelity website mockup for "${project.name}" (${project.url}).`
  );

  if (options.label) {
    parts.push(`This mockup is for the "${options.label}" page.`);
  }

  if (options.style) {
    parts.push(`Design style: ${options.style}.`);
  }

  if (project.clientProblems) {
    parts.push(
      `The client's current problems: ${project.clientProblems.slice(0, 500)}`
    );
  }

  if (project.competitorAnalysis) {
    parts.push(
      `Competitor analysis notes: ${project.competitorAnalysis.slice(0, 500)}`
    );
  }

  if (project.projectRequirements) {
    parts.push(
      `Project requirements: ${project.projectRequirements.slice(0, 500)}`
    );
  }

  if (project.clientNotes) {
    parts.push(`Additional client notes: ${project.clientNotes.slice(0, 300)}`);
  }

  // Add analysis summaries
  for (const analysis of analyses) {
    const content = analysis.content as Record<string, unknown> | null;
    if (!content) continue;
    const summary =
      (content.summary as string) || (content.overview as string);
    if (summary) {
      parts.push(`${analysis.type} analysis insight: ${summary.slice(0, 300)}`);
    }
  }

  // Add competitor context grouped by label
  const goodComps = competitors.filter((c) => c.screenshotLabel === "good");
  const badComps = competitors.filter((c) => c.screenshotLabel === "bad");
  const unlabeledComps = competitors.filter((c) => !c.screenshotLabel);

  const formatComp = (c: Competitor) => {
    const detail = [`${c.name} (${c.url})`];
    if (c.preferredFeature) detail.push(`preferred feature: ${c.preferredFeature}`);
    if (c.notes) detail.push(c.notes.slice(0, 150));
    const refs = c.referenceImages || [];
    const emulateCount = refs.filter(r => r.tag === "emulate").length + (c.screenshot && c.screenshotLabel !== "bad" ? 1 : 0);
    const avoidCount = refs.filter(r => r.tag === "avoid").length + (c.screenshot && c.screenshotLabel === "bad" ? 1 : 0);
    const untaggedCount = refs.filter(r => !r.tag).length;
    const tagParts: string[] = [];
    if (emulateCount > 0) tagParts.push(`${emulateCount} "emulate"`);
    if (avoidCount > 0) tagParts.push(`${avoidCount} "avoid"`);
    if (untaggedCount > 0) tagParts.push(`${untaggedCount} untagged`);
    if (tagParts.length > 0) detail.push(`screenshots: ${tagParts.join(", ")}`);
    return detail.join(" — ");
  };

  if (goodComps.length > 0) {
    parts.push(`POSITIVE INSPIRATION — emulate these design patterns, referencing the attached screenshots:\n${goodComps.slice(0, 5).map(formatComp).join("\n")}`);
  }
  if (badComps.length > 0) {
    parts.push(`NEGATIVE EXAMPLES — avoid these design patterns, as shown in the attached screenshots:\n${badComps.slice(0, 5).map(formatComp).join("\n")}`);
  }
  if (unlabeledComps.length > 0) {
    parts.push(`Competitor/inspiration sites (reference screenshots attached):\n${unlabeledComps.slice(0, 5).map(formatComp).join("\n")}`);
  }

  if (options.customPrompt) {
    parts.push(`Additional instructions: ${options.customPrompt}`);
  }

  parts.push(
    "The mockup should look like a real, polished website screenshot — not a wireframe. Include realistic text, images placeholders, navigation, and footer. Use modern web design conventions."
  );

  return parts.join("\n\n");
}

async function resolveImageToBase64(
  img: string
): Promise<{ mimeType: string; data: string } | null> {
  try {
    if (img.startsWith("http://") || img.startsWith("https://")) {
      const res = await fetch(img);
      if (!res.ok) return null;
      const contentType = res.headers.get("content-type") || "image/png";
      const buffer = await res.arrayBuffer();
      return {
        mimeType: contentType.split(";")[0],
        data: Buffer.from(buffer).toString("base64"),
      };
    }
    if (img.startsWith("data:")) {
      const mimeMatch = img.match(/^data:(image\/[\w+]+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
      const base64 = img.includes(",") ? img.split(",")[1] : img;
      return { mimeType, data: base64 };
    }
    // Assume raw base64
    return { mimeType: "image/png", data: img };
  } catch (e) {
    console.error("Failed to resolve reference image:", e);
    return null;
  }
}

export async function generateMockup(
  prompt: string,
  referenceImages?: string[],
  negativeReferenceImages?: string[]
): Promise<{ image: string; text: string }> {
  const contents: Array<
    | { text: string }
    | { inlineData: { mimeType: string; data: string } }
  > = [];

  // Add positive reference images
  if (referenceImages && referenceImages.length > 0) {
    const resolved = await Promise.all(
      referenceImages.slice(0, 5).map(resolveImageToBase64)
    );
    const valid = resolved.filter(Boolean) as { mimeType: string; data: string }[];
    if (valid.length > 0) {
      contents.push({
        text: "POSITIVE reference images — emulate these design patterns for the mockup:",
      });
      for (const imgData of valid) {
        contents.push({ inlineData: imgData });
      }
    }
  }

  // Add negative reference images
  if (negativeReferenceImages && negativeReferenceImages.length > 0) {
    const resolved = await Promise.all(
      negativeReferenceImages.slice(0, 3).map(resolveImageToBase64)
    );
    const valid = resolved.filter(Boolean) as { mimeType: string; data: string }[];
    if (valid.length > 0) {
      contents.push({
        text: "NEGATIVE examples — avoid these design patterns. Do NOT replicate these layouts or visual styles:",
      });
      for (const imgData of valid) {
        contents.push({ inlineData: imgData });
      }
    }
  }

  contents.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: "nano-banana-pro-preview",
    contents: [{ role: "user", parts: contents }],
    config: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  });

  let imageBase64 = "";
  let textResponse = "";

  if (response.candidates && response.candidates[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        imageBase64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      } else if (part.text) {
        textResponse += part.text;
      }
    }
  }

  if (!imageBase64) {
    throw new Error(
      "No image was generated. The model may not have returned an image for this prompt."
    );
  }

  return { image: imageBase64, text: textResponse };
}
