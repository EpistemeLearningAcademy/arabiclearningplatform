import { NextResponse } from "next/server";

const apiUrl = process.env.GREENFIELD_API_URL ?? "http://127.0.0.1:4000";
const sessionCookie = "greenfield_session";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }
  const body = (await request.json().catch(() => null)) as
    | { email?: unknown; password?: unknown }
    | null;

  if (
    !body ||
      typeof body.email !== "string" ||
    typeof body.password !== "string" || body.email.length > 254 || body.password.length > 1024
  ) {
    return NextResponse.json(
      { error: "Enter your email and password." },
      { status: 400 },
    );
  }

  try {
    const apiResponse = await fetch(`${apiUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const result = (await apiResponse.json().catch(() => ({}))) as {
      error?: string | { message?: string };
      token?: string;
      expiresAt?: string;
      user?: { id: string; email: string; name: string | null };
    };

    if (!apiResponse.ok || !result.token || !result.expiresAt || !result.user) {
      return NextResponse.json(
        { error: typeof result.error === "string" ? result.error : result.error?.message ?? "Sign-in could not be completed." },
        { status: apiResponse.ok ? 502 : apiResponse.status },
      );
    }

    const expiresAt = Date.parse(result.expiresAt);
    const response = NextResponse.json({ user: result.user });
    response.cookies.set(sessionCookie, result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)),
    });
    return response;
  } catch {
    return NextResponse.json(
      { error: "The school service is unavailable. Please try again." },
      { status: 503 },
    );
  }
}
