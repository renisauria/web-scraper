import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

function tokenFor(u: string, p: string) {
  return crypto.createHash("sha256").update(`${u}:${p}`).digest("hex");
}

export async function POST(req: NextRequest) {
  const { username = "", password = "" } = await req.json().catch(() => ({}));
  const envUser = process.env.BASIC_AUTH_USER || "";
  const envPass = process.env.BASIC_AUTH_PASSWORD || "";

  if (!envUser || !envPass) {
    return NextResponse.json(
      { ok: false, message: "Password gate not configured" },
      { status: 500 }
    );
  }

  if (username !== envUser || password !== envPass) {
    return NextResponse.json(
      { ok: false, message: "Invalid credentials" },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: "__gate",
    value: tokenFor(envUser, envPass),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({ name: "__gate", value: "", path: "/", maxAge: 0 });
  return res;
}

