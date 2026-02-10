import type { Product } from "@/types";

export function formatProductsForPrompt(products: Product[]): string {
  if (products.length === 0) return "";

  const lines: string[] = [
    "REAL PRODUCT DATA (use exact names, prices, descriptions):",
    "",
  ];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    lines.push(`Product ${i + 1}: "${p.name}"`);

    if (p.price) {
      lines.push(`- Price: ${p.price}${p.currency && p.currency !== "USD" ? ` ${p.currency}` : ""}`);
    }
    if (p.description) {
      lines.push(`- Description: ${p.description.slice(0, 150)}${p.description.length > 150 ? "..." : ""}`);
    }
    if (p.variants && p.variants.length > 0) {
      const variantSummary = p.variants
        .map((v) => `${v.name} (${v.options.length} options${v.options.length <= 5 ? ": " + v.options.join(", ") : ""})`)
        .join(", ");
      lines.push(`- Variants: ${variantSummary}`);
    }
    if (p.specifications && Object.keys(p.specifications).length > 0) {
      const specs = Object.entries(p.specifications)
        .slice(0, 5)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
      lines.push(`- Key specs: ${specs}`);
    }
    if (p.brand) {
      lines.push(`- Brand: ${p.brand}`);
    }
    if (p.availability) {
      lines.push(`- Availability: ${p.availability}`);
    }
    lines.push("");
  }

  // Truncate total output to ~2000 chars
  let result = lines.join("\n");
  if (result.length > 2000) {
    result = result.slice(0, 1997) + "...";
  }
  return result;
}
