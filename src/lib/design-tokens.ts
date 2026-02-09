import type { FlatToken } from "@/types";

/**
 * Recursively walks a W3C DTCG design-token tree and flattens it into
 * an array of FlatToken objects suitable for display and prompt injection.
 *
 * Supports $type inheritance from parent groups per the DTCG spec.
 */
export function parseDesignTokens(
  json: Record<string, unknown>,
  parentPath = "",
  inheritedType = ""
): FlatToken[] {
  const tokens: FlatToken[] = [];

  for (const [key, value] of Object.entries(json)) {
    if (key.startsWith("$")) continue; // skip meta keys like $description

    if (value && typeof value === "object" && !Array.isArray(value)) {
      const node = value as Record<string, unknown>;
      const nodeType = (node.$type as string) || inheritedType;

      if (node.$value !== undefined) {
        // This is a token leaf
        const path = parentPath ? `${parentPath}.${key}` : key;
        const type = nodeType || "unknown";
        tokens.push({
          path,
          type,
          displayValue: formatDisplayValue(node.$value, type),
          rawValue: node.$value,
        });
      } else {
        // This is a group — recurse
        const path = parentPath ? `${parentPath}.${key}` : key;
        tokens.push(...parseDesignTokens(node, path, nodeType));
      }
    }
  }

  return tokens;
}

function formatDisplayValue(value: unknown, type: string): string {
  if (value === null || value === undefined) return "";

  switch (type) {
    case "color":
      return typeof value === "string" ? value : JSON.stringify(value);

    case "typography":
    case "fontFamily": {
      if (typeof value === "string") return value;
      if (typeof value === "object" && value !== null) {
        const t = value as Record<string, unknown>;
        const parts: string[] = [];
        if (t.fontFamily) parts.push(String(t.fontFamily));
        if (t.fontSize) parts.push(String(t.fontSize));
        if (t.fontWeight) parts.push(String(t.fontWeight));
        if (t.lineHeight) parts.push(`/${String(t.lineHeight)}`);
        return parts.join(" ") || JSON.stringify(value);
      }
      return String(value);
    }

    case "dimension":
    case "spacing":
    case "sizing":
    case "borderRadius":
    case "borderWidth":
      return typeof value === "string" ? value : `${value}`;

    case "shadow":
    case "boxShadow": {
      if (typeof value === "string") return value;
      if (Array.isArray(value)) {
        return value.map((s) => formatShadow(s)).join(", ");
      }
      if (typeof value === "object" && value !== null) {
        return formatShadow(value as Record<string, unknown>);
      }
      return JSON.stringify(value);
    }

    case "fontWeight":
      return String(value);

    case "fontSize":
    case "lineHeight":
    case "letterSpacing":
      return String(value);

    default:
      return typeof value === "string" ? value : JSON.stringify(value);
  }
}

function formatShadow(s: Record<string, unknown>): string {
  const parts: string[] = [];
  if (s.offsetX) parts.push(String(s.offsetX));
  if (s.offsetY) parts.push(String(s.offsetY));
  if (s.blur) parts.push(String(s.blur));
  if (s.spread) parts.push(String(s.spread));
  if (s.color) parts.push(String(s.color));
  return parts.join(" ") || JSON.stringify(s);
}

/**
 * Converts flat tokens into a plain-text block for LLM prompt injection.
 */
export function formatTokensForPrompt(tokens: FlatToken[]): string {
  const sections: Record<string, string[]> = {};

  for (const token of tokens) {
    const category = categorizeToken(token.type);
    if (!sections[category]) sections[category] = [];
    sections[category].push(`- ${token.path}: ${token.displayValue}`);
  }

  const lines: string[] = [];
  const order = [
    "BRAND COLORS",
    "TYPOGRAPHY",
    "SPACING",
    "SHADOWS",
    "OTHER TOKENS",
  ];

  for (const heading of order) {
    if (sections[heading] && sections[heading].length > 0) {
      lines.push(`${heading}:`);
      lines.push(...sections[heading]);
      lines.push("");
    }
  }

  return lines.join("\n").trim();
}

function categorizeToken(type: string): string {
  switch (type) {
    case "color":
      return "BRAND COLORS";
    case "typography":
    case "fontFamily":
    case "fontWeight":
    case "fontSize":
    case "lineHeight":
    case "letterSpacing":
      return "TYPOGRAPHY";
    case "dimension":
    case "spacing":
    case "sizing":
    case "borderRadius":
    case "borderWidth":
      return "SPACING";
    case "shadow":
    case "boxShadow":
      return "SHADOWS";
    default:
      return "OTHER TOKENS";
  }
}

/**
 * Deep-clones the token tree and updates the $value at a given dot-path.
 * Returns the new token tree.
 */
export function updateTokenValue(
  tokens: Record<string, unknown>,
  path: string,
  newValue: unknown
): Record<string, unknown> {
  const clone = JSON.parse(JSON.stringify(tokens)) as Record<string, unknown>;
  const segments = path.split(".");
  let current: Record<string, unknown> = clone;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (i === segments.length - 1) {
      // We should be at the token node
      const node = current[seg];
      if (node && typeof node === "object" && !Array.isArray(node)) {
        (node as Record<string, unknown>).$value = newValue;
      }
    } else {
      const next = current[seg];
      if (next && typeof next === "object" && !Array.isArray(next)) {
        current = next as Record<string, unknown>;
      } else {
        break;
      }
    }
  }

  return clone;
}
