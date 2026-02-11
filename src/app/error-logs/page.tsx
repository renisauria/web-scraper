"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Trash2, RefreshCw, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface ErrorLog {
  id: string;
  route: string;
  method: string;
  message: string;
  stack: string | null;
  context: Record<string, unknown> | null;
  createdAt: string;
}

export default function ErrorLogsPage() {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/error-logs");
      const data = await res.json();
      setLogs(data.logs ?? []);
    } catch {
      toast.error("Failed to fetch error logs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const clearLogs = async () => {
    setClearing(true);
    try {
      const res = await fetch("/api/error-logs", { method: "DELETE" });
      if (!res.ok) throw new Error();
      setLogs([]);
      setExpandedIds(new Set());
      toast.success("Error logs cleared");
    } catch {
      toast.error("Failed to clear error logs");
    } finally {
      setClearing(false);
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const methodColor = (method: string) => {
    switch (method) {
      case "GET": return "bg-blue-100 text-blue-800";
      case "POST": return "bg-green-100 text-green-800";
      case "PUT": case "PATCH": return "bg-yellow-100 text-yellow-800";
      case "DELETE": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-6 w-6 text-destructive" />
          <h1 className="text-2xl font-bold">Error Logs</h1>
          {!loading && (
            <Badge variant="secondary">{logs.length} {logs.length === 1 ? "entry" : "entries"}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={clearLogs}
            disabled={clearing || logs.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All Logs
          </Button>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Loading error logs...
          </CardContent>
        </Card>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No error logs</p>
            <p className="text-sm mt-1">Errors from API routes will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => {
            const expanded = expandedIds.has(log.id);
            const hasDetails = log.stack || log.context;
            return (
              <Card key={log.id}>
                <CardHeader
                  className={`py-3 px-4 ${hasDetails ? "cursor-pointer" : ""}`}
                  onClick={() => hasDetails && toggleExpanded(log.id)}
                >
                  <div className="flex items-center gap-3">
                    {hasDetails ? (
                      expanded ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />
                    ) : (
                      <div className="w-4" />
                    )}
                    <Badge className={`font-mono text-xs ${methodColor(log.method)}`} variant="outline">
                      {log.method}
                    </Badge>
                    <code className="text-sm text-muted-foreground">{log.route}</code>
                    <span className="text-sm flex-1 truncate">{log.message}</span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                </CardHeader>
                {expanded && hasDetails && (
                  <CardContent className="pt-0 pb-4 px-4 ml-7">
                    {log.stack && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Stack Trace</p>
                        <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto whitespace-pre-wrap">{log.stack}</pre>
                      </div>
                    )}
                    {log.context && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Context</p>
                        <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto whitespace-pre-wrap">
                          {JSON.stringify(log.context, null, 2)}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
