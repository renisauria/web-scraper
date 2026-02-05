import Firecrawl from "@mendable/firecrawl-js";

let firecrawl: Firecrawl | null = null;

// Viewport screenshot (default - faster)
const VIEWPORT_SCREENSHOT_CONFIG = {
  type: "screenshot" as const,
  fullPage: false,
  viewport: { width: 1920, height: 1080 },
};

// Full-page screenshot (on demand)
const FULLPAGE_SCREENSHOT_CONFIG = {
  type: "screenshot" as const,
  fullPage: true,
  viewport: { width: 1920, height: 1080 },
};

function getFirecrawl(): Firecrawl {
  if (!firecrawl) {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      throw new Error("FIRECRAWL_API_KEY environment variable is required");
    }
    firecrawl = new Firecrawl({ apiKey });
  }
  return firecrawl;
}

export interface ScrapedPage {
  url: string;
  title?: string;
  content?: string;
  markdown?: string;
  screenshot?: string;
  metadata?: Record<string, unknown>;
}

export interface CrawlResult {
  success: boolean;
  pages: ScrapedPage[];
  error?: string;
}

export interface CrawlJobStart {
  success: boolean;
  jobId?: string;
  error?: string;
}

export interface CrawlStatus {
  success: boolean;
  status: "scraping" | "completed" | "failed" | "cancelled";
  completed: number;
  total: number;
  pages?: ScrapedPage[];
  error?: string;
}

export async function crawlWebsite(
  url: string,
  options: {
    limit?: number;
    maxDepth?: number;
  } = {}
): Promise<CrawlResult> {
  const { limit = 10, maxDepth = 2 } = options;

  try {
    const client = getFirecrawl();
    const crawlJob = await client.crawl(url, {
      limit,
      maxDiscoveryDepth: maxDepth,
      scrapeOptions: {
        formats: ["markdown", "html", VIEWPORT_SCREENSHOT_CONFIG],
      },
    });

    if (crawlJob.status !== "completed") {
      return {
        success: false,
        pages: [],
        error: `Crawl ${crawlJob.status}`,
      };
    }

    const pages: ScrapedPage[] = (crawlJob.data || []).map((doc) => ({
      url: doc.metadata?.url || url,
      title: doc.metadata?.title as string | undefined,
      content: doc.html,
      markdown: doc.markdown,
      screenshot: doc.screenshot,
      metadata: doc.metadata as Record<string, unknown>,
    }));

    return {
      success: true,
      pages,
    };
  } catch (error) {
    console.error("Firecrawl error:", error);
    return {
      success: false,
      pages: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function startAsyncCrawl(
  url: string,
  options: {
    limit?: number;
    maxDepth?: number;
  } = {}
): Promise<CrawlJobStart> {
  const { limit = 10, maxDepth = 2 } = options;

  try {
    const client = getFirecrawl();
    const response = await client.startCrawl(url, {
      limit,
      maxDiscoveryDepth: maxDepth,
      scrapeOptions: {
        formats: ["markdown", "html", VIEWPORT_SCREENSHOT_CONFIG],
      },
    });

    return {
      success: true,
      jobId: response.id,
    };
  } catch (error) {
    console.error("Firecrawl async crawl error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getCrawlStatus(jobId: string): Promise<CrawlStatus> {
  try {
    const client = getFirecrawl();
    const response = await client.getCrawlStatus(jobId);

    const pages: ScrapedPage[] | undefined =
      response.status === "completed" && response.data
        ? response.data.map((doc) => ({
            url: doc.metadata?.url || "",
            title: doc.metadata?.title,
            content: doc.html,
            markdown: doc.markdown,
            screenshot: doc.screenshot,
            metadata: doc.metadata as Record<string, unknown> | undefined,
          }))
        : undefined;

    return {
      success: true,
      status: response.status,
      completed: response.completed || 0,
      total: response.total || 0,
      pages,
    };
  } catch (error) {
    console.error("Firecrawl status check error:", error);
    return {
      success: false,
      status: "failed",
      completed: 0,
      total: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function scrapeSinglePage(url: string): Promise<ScrapedPage | null> {
  try {
    const client = getFirecrawl();
    const doc = await client.scrape(url, {
      formats: ["markdown", "html", VIEWPORT_SCREENSHOT_CONFIG],
    });

    return {
      url,
      title: doc.metadata?.title as string | undefined,
      content: doc.html,
      markdown: doc.markdown,
      screenshot: doc.screenshot,
      metadata: doc.metadata as Record<string, unknown>,
    };
  } catch (error) {
    console.error("Firecrawl scrape error:", error);
    return null;
  }
}

// Capture only a full-page screenshot (no content scraping)
export async function captureFullPageScreenshot(url: string): Promise<string | null> {
  try {
    const client = getFirecrawl();
    const doc = await client.scrape(url, {
      formats: [FULLPAGE_SCREENSHOT_CONFIG],
    });

    return doc.screenshot || null;
  } catch (error) {
    console.error("Firecrawl full-page screenshot error:", error);
    return null;
  }
}
