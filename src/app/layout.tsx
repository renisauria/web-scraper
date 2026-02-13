import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Globe, Kanban, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });
const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "600"],
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
});

export const metadata: Metadata = {
  title: "Website Analyzer - Marketing Strategy Tool",
  description: "Analyze websites for marketing strategy, tech stack, and architecture",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${ibmPlexMono.variable}`}>
        <div className="min-h-screen bg-background">
          <nav className="bg-card">
            <div className="container mx-auto px-4">
              <div className="flex h-16 items-center justify-between">
                <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
                  <Globe className="h-6 w-6" />
                  Website Analyzer
                </Link>
                <div className="flex items-center gap-6">
                  <Link
                    href="/projects"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Kanban className="h-4 w-4" />
                    Projects
                  </Link>
                  <Link
                    href="/error-logs"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <WarningCircle className="h-4 w-4" />
                    Error Logs
                  </Link>
                </div>
              </div>
            </div>
          </nav>
          <main className="container mx-auto px-4 py-8">{children}</main>
        </div>
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
