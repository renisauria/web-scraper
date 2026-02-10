"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Home,
  ShoppingBag,
  Package,
  FileText,
  BookOpen,
  Newspaper,
  File,
  ChevronRight,
  ChevronDown,
  Loader2,
  ExternalLink,
  RefreshCw,
  ArrowUpRight,
} from "lucide-react";
import type { SitemapNode } from "@/types";

const pageTypeIcons: Record<string, React.ReactNode> = {
  homepage: <Home className="h-4 w-4" />,
  collection: <ShoppingBag className="h-4 w-4" />,
  product: <Package className="h-4 w-4" />,
  page: <FileText className="h-4 w-4" />,
  blog: <BookOpen className="h-4 w-4" />,
  article: <Newspaper className="h-4 w-4" />,
  other: <File className="h-4 w-4" />,
};

interface SitemapTreeProps {
  node: SitemapNode;
  variant?: "current" | "recommended";
  depth?: number;
  defaultExpandDepth?: number;
  onScrapeNode?: (node: SitemapNode) => void;
  scrapingId?: string | null;
  baseUrl?: string | null;
  onRescrapeNode?: (node: SitemapNode) => void;
  rescrapingId?: string | null;
  projectId?: string;
}

function PriorityDot({ priority }: { priority: "high" | "medium" | "low" }) {
  const colors = {
    high: "bg-green-500",
    medium: "bg-yellow-500",
    low: "bg-red-500",
  };
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${colors[priority]}`}
      title={`${priority} priority`}
    />
  );
}

function SitemapTreeNode({
  node,
  variant = "current",
  depth = 0,
  defaultExpandDepth = 2,
  onScrapeNode,
  scrapingId,
  baseUrl,
  onRescrapeNode,
  rescrapingId,
  projectId,
}: SitemapTreeProps) {
  const [expanded, setExpanded] = useState(depth < defaultExpandDepth);
  const nodeUrl = node.url || (baseUrl ? baseUrl.replace(/\/$/, "") + node.path : null);
  const hasChildren = node.children && node.children.length > 0;

  const isNew = variant === "recommended" && node.metadata?.isNew;
  const isRemoved = variant === "recommended" && node.metadata?.isRemoved;
  const isMoved = variant === "recommended" && node.metadata?.isMoved;

  let rowClasses = "flex items-start gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors group";
  if (isNew) rowClasses += " bg-green-50 dark:bg-green-950/20";
  if (isRemoved) rowClasses += " bg-red-50 dark:bg-red-950/20";

  return (
    <div>
      <div className={rowClasses}>
        {/* Expand/collapse button */}
        <button
          onClick={() => hasChildren && setExpanded(!expanded)}
          className={`mt-0.5 shrink-0 ${hasChildren ? "cursor-pointer text-muted-foreground hover:text-foreground" : "invisible"}`}
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        {/* Icon */}
        <span className="mt-0.5 shrink-0 text-muted-foreground">
          {pageTypeIcons[node.pageType || "other"]}
        </span>

        {/* Label and badges */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {nodeUrl ? (
              <a
                href={nodeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-sm font-medium hover:underline inline-flex items-center gap-1 ${isRemoved ? "line-through text-red-500" : ""}`}
                onClick={(e) => e.stopPropagation()}
              >
                {node.label}
                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
              </a>
            ) : (
              <span
                className={`text-sm font-medium ${isRemoved ? "line-through text-red-500" : ""}`}
              >
                {node.label}
              </span>
            )}

            {variant === "recommended" && node.metadata?.priority && (
              <PriorityDot priority={node.metadata.priority} />
            )}

            {hasChildren && (
              <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-muted-foreground font-normal">
                {node.children.length}
              </Badge>
            )}

            {node.hasContent && variant === "current" && (
              node.metadata?.pageId && projectId ? (
                <Link
                  href={`/projects/${projectId}/pages/${node.metadata.pageId}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Badge className="text-[10px] py-0 px-1.5 cursor-pointer bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 border-0 inline-flex items-center gap-0.5">
                    already scraped
                    <ArrowUpRight className="h-2.5 w-2.5" />
                  </Badge>
                </Link>
              ) : (
                <Badge className="text-[10px] py-0 px-1.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
                  already scraped
                </Badge>
              )
            )}

            {isNew && (
              <Badge className="text-[10px] py-0 px-1.5 bg-green-600 hover:bg-green-700">
                NEW
              </Badge>
            )}

            {isRemoved && (
              <Badge variant="destructive" className="text-[10px] py-0 px-1.5">
                REMOVE
              </Badge>
            )}

            {isMoved && (
              <Badge className="text-[10px] py-0 px-1.5 bg-orange-500 hover:bg-orange-600">
                MOVED
              </Badge>
            )}

            {variant === "current" && !node.hasContent && onScrapeNode && (
              <Button
                variant="outline"
                size="sm"
                className="h-5 text-[10px] px-1.5 py-0"
                disabled={scrapingId === node.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onScrapeNode(node);
                }}
              >
                {scrapingId === node.id ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Scraping...
                  </>
                ) : (
                  "Scrape"
                )}
              </Button>
            )}

            {variant === "current" && node.hasContent && node.metadata?.pageId && onRescrapeNode && (
              <Button
                variant="outline"
                size="sm"
                className="h-5 text-[10px] px-1.5 py-0"
                disabled={rescrapingId === node.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onRescrapeNode(node);
                }}
              >
                {rescrapingId === node.id ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Scraping...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Scrape again
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Path */}
          <p className="text-xs text-muted-foreground truncate">{node.path}</p>

          {/* Moved from info */}
          {isMoved && node.metadata?.movedFrom && (
            <p className="text-xs text-orange-600 dark:text-orange-400">
              Moved from: {node.metadata.movedFrom}
            </p>
          )}

          {/* Notes */}
          {variant === "recommended" && node.metadata?.notes && (
            <p className="text-xs text-muted-foreground mt-0.5 italic">
              {node.metadata.notes}
            </p>
          )}
        </div>
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div className="ml-4 pl-2 border-l border-border">
          {node.children.map((child) => (
            <SitemapTreeNode
              key={child.id}
              node={child}
              variant={variant}
              depth={depth + 1}
              defaultExpandDepth={defaultExpandDepth}
              onScrapeNode={onScrapeNode}
              scrapingId={scrapingId}
              baseUrl={baseUrl}
              onRescrapeNode={onRescrapeNode}
              rescrapingId={rescrapingId}
              projectId={projectId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function SitemapTree({
  node,
  variant = "current",
  defaultExpandDepth = 2,
  onScrapeNode,
  scrapingId,
  baseUrl,
  onRescrapeNode,
  rescrapingId,
  projectId,
}: {
  node: SitemapNode;
  variant?: "current" | "recommended";
  defaultExpandDepth?: number;
  onScrapeNode?: (node: SitemapNode) => void;
  scrapingId?: string | null;
  baseUrl?: string | null;
  onRescrapeNode?: (node: SitemapNode) => void;
  rescrapingId?: string | null;
  projectId?: string;
}) {
  return (
    <div className="font-mono">
      <SitemapTreeNode
        node={node}
        variant={variant}
        depth={0}
        defaultExpandDepth={defaultExpandDepth}
        onScrapeNode={onScrapeNode}
        scrapingId={scrapingId}
        baseUrl={baseUrl}
        onRescrapeNode={onRescrapeNode}
        rescrapingId={rescrapingId}
        projectId={projectId}
      />
    </div>
  );
}
