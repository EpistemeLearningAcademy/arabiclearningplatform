import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const apiUrl = process.env.GREENFIELD_API_URL ?? "http://127.0.0.1:4000";
const sessionCookie = "greenfield_session";

export async function GET() {
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token) {
    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  }

  try {
    const apiResponse = await fetch(`${apiUrl}/campuses`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const result = await apiResponse.json().catch(() => ({ error: "Could not load schools." }));
    return NextResponse.json(result, {
      status: apiResponse.status,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "The school service is unavailable. Please try again." },
      { status: 503 },
    );
  }
}
