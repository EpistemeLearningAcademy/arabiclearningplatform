import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const apiUrl = process.env.GREENFIELD_API_URL ?? "http://127.0.0.1:4000";

export async function GET(
  _request: Request,
  context: { params: Promise<{ campusId: string }> },
) {
  const { campusId } = await context.params;
  const token = (await cookies()).get("greenfield_session")?.value;
  if (!token) {
    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  }

  try {
    const apiResponse = await fetch(
      `${apiUrl}/campuses/${encodeURIComponent(campusId)}/permissions`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );
    const result = await apiResponse.json().catch(() => ({ error: "Could not load permissions." }));
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

