import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const apiUrl = process.env.GREENFIELD_API_URL ?? "http://127.0.0.1:4000";
const sessionCookie = "greenfield_session";
const supportedPath = (path: string[]) => {
  const value = path.join("/");
  return value === "me" || value === "role-assignments" || /^role-assignments\/[A-Za-z0-9_-]+\/revoke$/.test(value) ||
    ["academic/years", "academic/terms", "academic/sections", "academic/levels", "academic/classes", "academic/subjects", "academic/teacher-assignments", "academic/enrollments"].includes(value) ||
    /^academic\/years\/[A-Za-z0-9_-]+\/terms$/.test(value);
};

async function forward(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  if (!supportedPath(path)) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Backend route is unavailable." } }, { status: 404 });
  if (request.method !== "GET") {
    const origin = request.headers.get("origin");
    const requestOrigin = new URL(request.url).origin;
    if (!origin || origin !== requestOrigin) return NextResponse.json({ error: { code: "CSRF_REJECTED", message: "Request origin is not allowed." } }, { status: 403 });
  }
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token) return NextResponse.json({ error: { code: "UNAUTHENTICATED", message: "Sign in to continue." } }, { status: 401 });
  const url = `${apiUrl}/${path.map((part) => encodeURIComponent(part)).join("/")}${new URL(request.url).search}`;
  try {
    const upstream = await fetch(url, {
      method: request.method,
      headers: { Authorization: `Bearer ${token}`, ...(request.method === "GET" ? {} : { "Content-Type": "application/json" }) },
      ...(request.method === "GET" ? {} : { body: await request.text() }),
      cache: "no-store",
    });
    const content = await upstream.json().catch(() => ({ error: { code: "INVALID_UPSTREAM_RESPONSE", message: "Backend returned an invalid response." } }));
    return NextResponse.json(content, { status: upstream.status, headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: { code: "SERVICE_UNAVAILABLE", message: "The school service is unavailable." } }, { status: 503 });
  }
}

export const GET = forward;
export const POST = forward;
