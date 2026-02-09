"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    clientName: "",
    clientProblems: "",
    competitorAnalysis: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Normalize URL
      let url = formData.url.trim();
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
      }

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          url,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create project");
      }

      toast.success("Project created!");
      router.push(`/projects/${data.project.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/projects"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Project</CardTitle>
          <CardDescription>
            Enter the website details to start analyzing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                placeholder="My Website Analysis"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">Website URL *</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
                required
              />
              <p className="text-sm text-muted-foreground">
                Enter the full URL of the website you want to analyze
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name (Optional)</Label>
              <Input
                id="clientName"
                placeholder="Acme Corp"
                value={formData.clientName}
                onChange={(e) =>
                  setFormData({ ...formData, clientName: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientProblems">Client Problems (Optional)</Label>
              <Textarea
                id="clientProblems"
                placeholder="Describe current challenges the client is facing with their website..."
                value={formData.clientProblems}
                onChange={(e) =>
                  setFormData({ ...formData, clientProblems: e.target.value })
                }
                rows={3}
              />
              <p className="text-sm text-muted-foreground">
                Adding client problems helps improve AI analysis recommendations
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="competitorAnalysis">Competitor Analysis & Desired Features (Optional)</Label>
              <Textarea
                id="competitorAnalysis"
                placeholder="Competitor insights, desired features, and functionality goals..."
                value={formData.competitorAnalysis}
                onChange={(e) =>
                  setFormData({ ...formData, competitorAnalysis: e.target.value })
                }
                rows={3}
              />
              <p className="text-sm text-muted-foreground">
                Adding competitor analysis helps the AI tailor its recommendations
              </p>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Project
              </Button>
              <Link href="/projects">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
