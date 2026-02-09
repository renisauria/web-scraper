export interface SitemapXmlResult {
  urls: string[];
  childSitemapsFound: number;
  errors: string[];
}

function decodeXmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"');
}

function extractLocs(xml: string): string[] {
  const locs: string[] = [];
  const regex = /<loc>\s*(.*?)\s*<\/loc>/gi;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    const url = decodeXmlEntities(match[1].trim());
    if (url) locs.push(url);
  }
  return locs;
}

function isSitemapIndex(xml: string): boolean {
  return /<sitemapindex[\s>]/i.test(xml);
}

async function fetchXml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; SitemapParser/1.0)" },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${url}`);
  }
  return response.text();
}

export async function fetchAndParseSitemapXml(
  siteUrl: string
): Promise<SitemapXmlResult> {
  const errors: string[] = [];
  const baseUrl = new URL(siteUrl);
  const sitemapUrl = `${baseUrl.origin}/sitemap.xml`;

  let xml: string;
  try {
    xml = await fetchXml(sitemapUrl);
  } catch (err) {
    return {
      urls: [],
      childSitemapsFound: 0,
      errors: [`Failed to fetch ${sitemapUrl}: ${err instanceof Error ? err.message : String(err)}`],
    };
  }

  if (isSitemapIndex(xml)) {
    const childUrls = extractLocs(xml);
    const childSitemapsFound = childUrls.length;

    const results = await Promise.allSettled(
      childUrls.map((childUrl) => fetchXml(childUrl))
    );

    const allUrls: string[] = [];
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === "fulfilled") {
        allUrls.push(...extractLocs(result.value));
      } else {
        errors.push(`Failed to fetch child sitemap ${childUrls[i]}: ${result.reason}`);
      }
    }

    return { urls: allUrls, childSitemapsFound, errors };
  }

  // Direct urlset
  const urls = extractLocs(xml);
  return { urls, childSitemapsFound: 0, errors };
}
