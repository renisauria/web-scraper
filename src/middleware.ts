import { NextRequest, NextResponse } from "next/server";

async function tokenFor(u: string, p: string) {
  const data = new TextEncoder().encode(`${u}:${p}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = Array.from(new Uint8Array(digest));
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function middleware(req: NextRequest) {
  const username = process.env.BASIC_AUTH_USER || "";
  const password = process.env.BASIC_AUTH_PASSWORD || "";

  // If not configured, do nothing
  if (!username || !password) return NextResponse.next();

  const { pathname, search } = req.nextUrl;
  // Allow the auth page and API, plus Next internals and public files
  const allow =
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.startsWith("/assets");

  if (allow) return NextResponse.next();

  const cookie = req.cookies.get("__gate")?.value;
  const expected = await tokenFor(username, password);
  if (cookie === expected) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/auth";
  const nextParam = `${pathname}${search}`;
  url.search = nextParam ? `?next=${encodeURIComponent(nextParam)}` : "";

  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico|robots.txt|sitemap.xml|assets).*)"],
};
