export interface ShopifyTemplate {
  name: string;
  count: number;
  pages: string[];
}

export interface PlatformInfo {
  platform: "shopify" | "wordpress" | "wix" | "squarespace" | "webflow" | "custom" | "unknown";
  confidence: "high" | "medium" | "low";
  signals: string[];
  detectedAt: string;
  shopify?: {
    themeName: string | null;
    themeId: string | null;
    templates: ShopifyTemplate[];
  };
  wordpress?: {
    themeName: string | null;
    plugins: string[];
  };
}

interface DetectionInput {
  url: string;
  html?: string;
  metadata?: Record<string, unknown>;
}

interface PlatformCandidate {
  platform: PlatformInfo["platform"];
  signals: string[];
}

function detectShopify(pages: DetectionInput[]): PlatformCandidate | null {
  const signals: string[] = [];

  for (const page of pages) {
    const meta = page.metadata || {};
    if (meta["shopify-checkout-api-token"] || meta["shopify-digital-wallet"]) {
      signals.push("shopify-checkout-api-token in metadata");
      break;
    }
  }

  for (const page of pages) {
    const html = page.html || "";
    if (html.includes("cdn.shopify.com")) {
      signals.push("cdn.shopify.com in HTML");
      break;
    }
  }

  for (const page of pages) {
    const html = page.html || "";
    if (/Shopify\.theme\s*=/.test(html)) {
      signals.push("Shopify.theme JS object in HTML");
      break;
    }
  }

  for (const page of pages) {
    if (page.url.includes(".myshopify.com")) {
      signals.push(".myshopify.com in URL");
      break;
    }
  }

  for (const page of pages) {
    const html = page.html || "";
    if (/class="[^"]*template-\w+/.test(html)) {
      signals.push("Shopify template-* body classes");
      break;
    }
  }

  for (const page of pages) {
    const html = page.html || "";
    if (html.includes("shopify-section")) {
      signals.push("shopify-section elements in HTML");
      break;
    }
  }

  return signals.length > 0 ? { platform: "shopify", signals } : null;
}

function detectWordPress(pages: DetectionInput[]): PlatformCandidate | null {
  const signals: string[] = [];

  for (const page of pages) {
    const html = page.html || "";
    if (html.includes("wp-content/")) {
      signals.push("wp-content/ path in HTML");
      break;
    }
  }

  for (const page of pages) {
    const html = page.html || "";
    if (html.includes("wp-includes/")) {
      signals.push("wp-includes/ path in HTML");
      break;
    }
  }

  for (const page of pages) {
    const html = page.html || "";
    if (html.includes("wp-json")) {
      signals.push("wp-json API reference in HTML");
      break;
    }
  }

  for (const page of pages) {
    const html = page.html || "";
    if (/generator.*wordpress/i.test(html)) {
      signals.push("WordPress generator meta tag");
      break;
    }
  }

  return signals.length > 0 ? { platform: "wordpress", signals } : null;
}

function detectWix(pages: DetectionInput[]): PlatformCandidate | null {
  const signals: string[] = [];

  for (const page of pages) {
    const html = page.html || "";
    if (html.includes("wixstatic.com")) {
      signals.push("wixstatic.com in HTML");
      break;
    }
  }

  for (const page of pages) {
    const html = page.html || "";
    if (/static\.wixstatic\.com|static\.parastorage\.com|wix-code-sdk/.test(html)) {
      signals.push("Wix platform assets in HTML");
      break;
    }
  }

  for (const page of pages) {
    const html = page.html || "";
    if (/generator.*wix/i.test(html)) {
      signals.push("Wix generator meta tag");
      break;
    }
  }

  return signals.length > 0 ? { platform: "wix", signals } : null;
}

function detectSquarespace(pages: DetectionInput[]): PlatformCandidate | null {
  const signals: string[] = [];

  for (const page of pages) {
    const html = page.html || "";
    if (html.includes("static1.squarespace.com") || html.includes("squarespace-cdn.com")) {
      signals.push("Squarespace CDN in HTML");
      break;
    }
  }

  for (const page of pages) {
    const html = page.html || "";
    if (/generator.*squarespace/i.test(html)) {
      signals.push("Squarespace generator meta tag");
      break;
    }
  }

  for (const page of pages) {
    const html = page.html || "";
    if (html.includes("data-squarespace-cacheversion")) {
      signals.push("Squarespace cache version attribute");
      break;
    }
  }

  return signals.length > 0 ? { platform: "squarespace", signals } : null;
}

function detectWebflow(pages: DetectionInput[]): PlatformCandidate | null {
  const signals: string[] = [];

  for (const page of pages) {
    const html = page.html || "";
    if (/data-wf-/.test(html)) {
      signals.push("data-wf-* attributes in HTML");
      break;
    }
  }

  for (const page of pages) {
    const html = page.html || "";
    if (html.includes("webflow.io") || html.includes("assets.website-files.com")) {
      signals.push("Webflow hosting references in HTML");
      break;
    }
  }

  for (const page of pages) {
    const html = page.html || "";
    if (/generator.*webflow/i.test(html)) {
      signals.push("Webflow generator meta tag");
      break;
    }
  }

  return signals.length > 0 ? { platform: "webflow", signals } : null;
}

function extractShopifyDetails(pages: DetectionInput[]): PlatformInfo["shopify"] {
  let themeName: string | null = null;
  let themeId: string | null = null;

  for (const page of pages) {
    const html = page.html || "";
    const themeMatch = html.match(/Shopify\.theme\s*=\s*\{[^}]*"name"\s*:\s*"([^"]+)"/);
    if (!themeMatch) {
      const altMatch = html.match(/Shopify\.theme\s*=\s*\{[^}]*name:\s*["']([^"']+)["']/);
      if (altMatch) {
        themeName = altMatch[1];
      }
    } else {
      themeName = themeMatch[1];
    }

    const idMatch = html.match(/Shopify\.theme\s*=\s*\{[^}]*"id"\s*:\s*(\d+)/);
    if (!idMatch) {
      const altIdMatch = html.match(/Shopify\.theme\s*=\s*\{[^}]*id:\s*(\d+)/);
      if (altIdMatch) {
        themeId = altIdMatch[1];
      }
    } else {
      themeId = idMatch[1];
    }

    if (themeName) break;
  }

  // Extract templates from body classes
  const templateMap = new Map<string, string[]>();
  for (const page of pages) {
    const html = page.html || "";
    const bodyMatch = html.match(/<body[^>]*class="([^"]*)"/);
    if (bodyMatch) {
      const classes = bodyMatch[1];
      const templateMatch = classes.match(/template-(\w+)/);
      if (templateMatch) {
        const templateName = templateMatch[1];
        const existing = templateMap.get(templateName) || [];
        existing.push(page.url);
        templateMap.set(templateName, existing);
      }
    }
  }

  const templates: ShopifyTemplate[] = Array.from(templateMap.entries()).map(([name, pageUrls]) => ({
    name,
    count: pageUrls.length,
    pages: pageUrls.slice(0, 5), // Limit to 5 sample pages
  }));

  return { themeName, themeId, templates };
}

function extractWordPressDetails(pages: DetectionInput[]): PlatformInfo["wordpress"] {
  let themeName: string | null = null;
  const plugins = new Set<string>();

  for (const page of pages) {
    const html = page.html || "";
    const themeMatch = html.match(/wp-content\/themes\/([^/"]+)/);
    if (themeMatch && !themeName) {
      themeName = themeMatch[1];
    }
    let pluginMatch;
    const pluginRe = /wp-content\/plugins\/([^/"]+)/g;
    while ((pluginMatch = pluginRe.exec(html)) !== null) {
      plugins.add(pluginMatch[1]);
    }
  }

  return { themeName, plugins: Array.from(plugins) };
}

function getConfidence(signals: string[]): PlatformInfo["confidence"] {
  if (signals.length >= 3) return "high";
  if (signals.length >= 2) return "medium";
  return "low";
}

export function detectPlatform(pages: DetectionInput[]): PlatformInfo {
  if (!pages || pages.length === 0) {
    return {
      platform: "unknown",
      confidence: "low",
      signals: [],
      detectedAt: new Date().toISOString(),
    };
  }

  // Run all detectors
  const candidates: PlatformCandidate[] = [];
  const shopify = detectShopify(pages);
  if (shopify) candidates.push(shopify);
  const wordpress = detectWordPress(pages);
  if (wordpress) candidates.push(wordpress);
  const wix = detectWix(pages);
  if (wix) candidates.push(wix);
  const squarespace = detectSquarespace(pages);
  if (squarespace) candidates.push(squarespace);
  const webflow = detectWebflow(pages);
  if (webflow) candidates.push(webflow);

  if (candidates.length === 0) {
    return {
      platform: "unknown",
      confidence: "low",
      signals: [],
      detectedAt: new Date().toISOString(),
    };
  }

  // Pick the candidate with the most signals
  candidates.sort((a, b) => b.signals.length - a.signals.length);
  const winner = candidates[0];

  const result: PlatformInfo = {
    platform: winner.platform,
    confidence: getConfidence(winner.signals),
    signals: winner.signals,
    detectedAt: new Date().toISOString(),
  };

  if (winner.platform === "shopify") {
    result.shopify = extractShopifyDetails(pages);
  } else if (winner.platform === "wordpress") {
    result.wordpress = extractWordPressDetails(pages);
  }

  return result;
}
