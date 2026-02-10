import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export interface ExtractedProduct {
  name: string;
  description: string | null;
  price: string | null;
  currency: string;
  variants: { name: string; options: string[] }[];
  specifications: Record<string, string>;
  images: string[];
  category: string | null;
  brand: string | null;
  sku: string | null;
  availability: string | null;
}

export interface ExtractionResult {
  success: boolean;
  products: ExtractedProduct[];
  pageType: "single_product" | "collection" | "no_products";
  error?: string;
}

export async function extractProductsFromContent(
  markdownContent: string,
  pageUrl: string
): Promise<ExtractionResult> {
  // Truncate to ~12000 chars to stay within token limits
  const truncated = markdownContent.slice(0, 12000);

  const systemPrompt = `You are a product data extraction specialist. Given website page content in markdown format, extract structured product information.

First, detect the page type:
- "single_product": A dedicated product detail page with one main product
- "collection": A listing/category page with multiple products
- "no_products": Not a product page (e.g., About, Contact, Blog)

For each product found, extract:
- name: Product name (required)
- description: Product description text
- price: Price as displayed (e.g., "$29.99", "$10 - $20", "from $99")
- currency: ISO currency code (e.g., "USD", "EUR", "GBP")
- variants: Array of variant groups, each with {name, options[]} (e.g., {name: "Size", options: ["S","M","L"]})
- specifications: Key-value object of product specs (e.g., {"Material": "Cotton", "Weight": "200g"})
- images: Array of image URLs found in the content (resolve relative URLs against the page URL)
- category: Product category if detectable
- brand: Brand name if mentioned
- sku: SKU/product ID if shown
- availability: Stock status (e.g., "In Stock", "Out of Stock", "Pre-order")

Rules:
- Extract up to 20 products maximum (for collection pages)
- If price has a currency symbol, set currency accordingly ($ = USD, € = EUR, £ = GBP)
- Convert relative image URLs to absolute using the provided page URL
- If no products are found, return pageType "no_products" with empty products array
- Return valid JSON only

Return JSON with this structure:
{
  "pageType": "single_product" | "collection" | "no_products",
  "products": [...]
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Page URL: ${pageUrl}\n\nPage content:\n${truncated}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 4000,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      return {
        success: false,
        products: [],
        pageType: "no_products",
        error: "No response from OpenAI",
      };
    }

    const parsed = JSON.parse(responseContent);
    const products: ExtractedProduct[] = (parsed.products || []).map(
      (p: Record<string, unknown>) => ({
        name: String(p.name || "Unnamed Product"),
        description: p.description ? String(p.description) : null,
        price: p.price ? String(p.price) : null,
        currency: String(p.currency || "USD"),
        variants: Array.isArray(p.variants) ? p.variants : [],
        specifications:
          p.specifications && typeof p.specifications === "object"
            ? (p.specifications as Record<string, string>)
            : {},
        images: Array.isArray(p.images) ? p.images.map(String) : [],
        category: p.category ? String(p.category) : null,
        brand: p.brand ? String(p.brand) : null,
        sku: p.sku ? String(p.sku) : null,
        availability: p.availability ? String(p.availability) : null,
      })
    );

    return {
      success: true,
      products,
      pageType: parsed.pageType || "no_products",
    };
  } catch (error) {
    console.error("Product extraction error:", error);
    return {
      success: false,
      products: [],
      pageType: "no_products",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
