import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const apiUrl = process.env.GREENFIELD_API_URL ?? "http://127.0.0.1:4000";
const sessionCookie = "greenfield_session";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }
  const token = (await cookies()).get(sessionCookie)?.value;
  let status = 200;
  if (token) {
    try {
      const result = await fetch(`${apiUrl}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!result.ok && result.status !== 401) status = 503;
    } catch {
      status = 503;
    }
  }

  const response = NextResponse.json(
    status === 200 ? { ok: true } : { error: "Session revocation could not be confirmed." },
    { status },
  );
  response.cookies.set(sessionCookie, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

