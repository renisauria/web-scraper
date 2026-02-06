"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
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
}: SitemapTreeProps) {
  const [expanded, setExpanded] = useState(depth < defaultExpandDepth);
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
            <span
              className={`text-sm font-medium ${isRemoved ? "line-through text-red-500" : ""}`}
            >
              {node.label}
            </span>

            {variant === "recommended" && node.metadata?.priority && (
              <PriorityDot priority={node.metadata.priority} />
            )}

            {node.hasContent && variant === "current" && (
              <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                scraped
              </Badge>
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
}: {
  node: SitemapNode;
  variant?: "current" | "recommended";
  defaultExpandDepth?: number;
}) {
  return (
    <div className="font-mono">
      <SitemapTreeNode
        node={node}
        variant={variant}
        depth={0}
        defaultExpandDepth={defaultExpandDepth}
      />
    </div>
  );
}
