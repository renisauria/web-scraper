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

export function buildCurrentSitemap(
  pages: Page[],
  projectUrl: string
): SitemapData {
  const baseUrl = new URL(projectUrl);
  const baseHost = baseUrl.hostname;

  // Build a map of path -> node
  const nodeMap = new Map<string, SitemapNode>();
  const scrapedPaths = new Set<string>();

  // Track which pages we've seen
  for (const page of pages) {
    try {
      const parsed = new URL(page.url);
      if (parsed.hostname !== baseHost) continue;
      const pathname = parsed.pathname.replace(/\/$/, "") || "/";
      scrapedPaths.add(pathname);
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
    hasContent: scrapedPaths.has("/"),
    children: [],
    metadata: {
      title: pages.find((p) => {
        try {
          const parsed = new URL(p.url);
          const pathname = parsed.pathname.replace(/\/$/, "") || "/";
          return pathname === "/" && parsed.hostname === baseHost;
        } catch {
          return false;
        }
      })?.title || undefined,
    },
  };
  nodeMap.set("/", rootNode);

  // Collect all unique paths (from scraped pages)
  const allPaths = Array.from(scrapedPaths).sort();

  // Build tree by ensuring all intermediate nodes exist
  for (const pathname of allPaths) {
    if (pathname === "/") continue;

    const segments = pathname.split("/").filter(Boolean);
    let currentPath = "";

    for (let i = 0; i < segments.length; i++) {
      const parentPath = currentPath || "/";
      currentPath = "/" + segments.slice(0, i + 1).join("/");

      if (!nodeMap.has(currentPath)) {
        const page = pages.find((p) => {
          try {
            const parsed = new URL(p.url);
            const pPath = parsed.pathname.replace(/\/$/, "") || "/";
            return pPath === currentPath && parsed.hostname === baseHost;
          } catch {
            return false;
          }
        });

        const node: SitemapNode = {
          id: uuidv4(),
          label: labelFromSegment(segments[i]),
          path: currentPath,
          url: page ? page.url : `${baseUrl.origin}${currentPath}`,
          pageType: inferPageType(currentPath),
          hasContent: scrapedPaths.has(currentPath),
          children: [],
          metadata: {
            title: page?.title || undefined,
          },
        };

        nodeMap.set(currentPath, node);

        // Attach to parent
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
