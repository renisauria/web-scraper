import type { Page } from "@/lib/db/schema";
import type { SitemapNode, SitemapData } from "@/types";
import { v4 as uuidv4 } from "uuid";

function inferPageType(
  path: string
): SitemapNode["pageType"] {
  if (path === "/" || path === "") return "homepage";
  if (/^\/collections\/?$/i.test(path) || /^\/collections\/[^/]+\/?$/i.test(path))
    return "collection";
  if (/^\/products\/[^/]+\/?$/i.test(path)) return "product";
  if (/^\/pages\/[^/]+\/?$/i.test(path)) return "page";
  if (/^\/blogs\/?$/i.test(path) || /^\/blogs\/[^/]+\/?$/i.test(path))
    return "blog";
  if (/^\/blogs\/[^/]+\/[^/]+\/?$/i.test(path)) return "article";
  return "other";
}

function labelFromSegment(segment: string): string {
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Build a sitemap tree from raw URL strings. All nodes get hasContent: false.
 */
export function buildSitemapFromUrls(
  urls: string[],
  projectUrl: string
): SitemapData {
  const baseUrl = new URL(projectUrl);
  const baseHost = baseUrl.hostname;

  const nodeMap = new Map<string, SitemapNode>();
  const paths = new Set<string>();

  for (const rawUrl of urls) {
    try {
      const parsed = new URL(rawUrl);
      if (parsed.hostname !== baseHost) continue;
      const pathname = parsed.pathname.replace(/\/$/, "") || "/";
      paths.add(pathname);
    } catch {
      // skip invalid URLs
    }
  }

  // Create root node
  const rootNode: SitemapNode = {
    id: uuidv4(),
    label: baseHost,
    path: "/",
    url: projectUrl,
    pageType: "homepage",
    hasContent: false,
    children: [],
  };
  nodeMap.set("/", rootNode);

  const allPaths = Array.from(paths).sort();

  for (const pathname of allPaths) {
    if (pathname === "/") continue;

    const segments = pathname.split("/").filter(Boolean);
    let currentPath = "";

    for (let i = 0; i < segments.length; i++) {
      const parentPath = currentPath || "/";
      currentPath = "/" + segments.slice(0, i + 1).join("/");

      if (!nodeMap.has(currentPath)) {
        const node: SitemapNode = {
          id: uuidv4(),
          label: labelFromSegment(segments[i]),
          path: currentPath,
          url: `${baseUrl.origin}${currentPath}`,
          pageType: inferPageType(currentPath),
          hasContent: false,
          children: [],
        };

        nodeMap.set(currentPath, node);

        const parentNode = nodeMap.get(parentPath);
        if (parentNode) {
          parentNode.children.push(node);
        }
      }
    }
  }

  // Calculate stats
  let maxDepth = 0;
  let totalPages = 0;
  function walkTree(node: SitemapNode, depth: number) {
    totalPages++;
    if (depth > maxDepth) maxDepth = depth;
    for (const child of node.children) {
      walkTree(child, depth + 1);
    }
  }
  walkTree(rootNode, 0);

  return {
    rootNode,
    totalPages,
    maxDepth,
    generatedAt: new Date().toISOString(),
    projectUrl,
  };
}

export function buildCurrentSitemap(
  pages: Page[],
  projectUrl: string
): SitemapData {
  const baseUrl = new URL(projectUrl);
  const baseHost = baseUrl.hostname;

  // Build a map of path -> page for metadata lookup
  const pageByPath = new Map<string, Page>();
  const urls: string[] = [];

  for (const page of pages) {
    try {
      const parsed = new URL(page.url);
      if (parsed.hostname !== baseHost) continue;
      const pathname = parsed.pathname.replace(/\/$/, "") || "/";
      pageByPath.set(pathname, page);
      urls.push(page.url);
    } catch {
      // skip invalid URLs
    }
  }

  // Build the base tree from URLs
  const sitemap = buildSitemapFromUrls(urls, projectUrl);

  // Walk the tree and enrich nodes with scraped page data
  function enrichNode(node: SitemapNode) {
    const page = pageByPath.get(node.path);
    if (page) {
      node.hasContent = true;
      node.url = page.url;
      node.metadata = {
        ...node.metadata,
        title: page.title || undefined,
      };
    }
    for (const child of node.children) {
      enrichNode(child);
    }
  }
  enrichNode(sitemap.rootNode);

  return sitemap;
}
