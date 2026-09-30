import { cache } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

export const apiUrl = process.env.GREENFIELD_API_URL ?? "http://127.0.0.1:4000";
const sessionCookieName = "greenfield_session";

type CampusResponse = {
  campus: {
    id: string;
    name: string;
    slug: string;
    school: { id: string; name: string; slug: string };
  };
  role: string;
};

type MeResponse = {
  data: {
    user: { id: string; email: string; name: string | null };
    campusMemberships: Array<{
      role: string;
      campus: {
        id: string;
        name: string;
        slug: string;
        school: { id: string; name: string; slug: string };
      };
    }>;
    roleAssignments: Array<{
      id: string;
      roleKey: string;
      scopeType: string;
      scopeId: string | null;
      createdAt: string;
      role: { description: string };
      permissions: string[];
    }>;
  };
};

type PermissionsResponse = { permissions: string[] };

export type BackendResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number };

export async function requireSessionToken() {
  const token = (await cookies()).get(sessionCookieName)?.value;
  if (!token) redirect("/");
  return token;
}

/** Server-side GET against the Greenfield API. Never throws for HTTP or network failures. */
export async function backendGet<T>(
  path: string,
  token: string,
): Promise<BackendResult<T>> {
  try {
    const response = await fetch(`${apiUrl}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!response.ok) return { ok: false, status: response.status };

    return { ok: true, data: (await response.json()) as T };
  } catch {
    return { ok: false, status: 503 };
  }
}

export type ReadyCampusContext = {
  status: "ready";
  /** Server-only. Never pass this to a client component. */
  token: string;
  campus: CampusResponse["campus"];
  role: string;
  user: MeResponse["data"]["user"];
  roleAssignments: MeResponse["data"]["roleAssignments"];
  permissions: ReadonlySet<string>;
  permissionsLoaded: boolean;
};

export type CampusContext = ReadyCampusContext | { status: "unavailable" };

/** Loaded once per request, shared by the campus layout and its pages. */
export const getCampusContext = cache(
  async (campusId: string): Promise<CampusContext> => {
    const token = await requireSessionToken();
    const encoded = encodeURIComponent(campusId);

    const [campusResult, meResult, permissionsResult] = await Promise.all([
      backendGet<CampusResponse>(`/campuses/${encoded}/me`, token),
      backendGet<MeResponse>("/me", token),
      backendGet<PermissionsResponse>(`/campuses/${encoded}/permissions`, token),
    ]);

    if (!campusResult.ok) {
      if (campusResult.status === 401) redirect("/");
      if (campusResult.status === 403 || campusResult.status === 404) notFound();
      return { status: "unavailable" };
    }

    if (!meResult.ok) {
      if (meResult.status === 401) redirect("/");
      return { status: "unavailable" };
    }

    if (!permissionsResult.ok && permissionsResult.status === 401) redirect("/");

    const membership = meResult.data.data.campusMemberships.find(
      (item) => item.campus.id === campusResult.data.campus.id,
    );

    return {
      status: "ready",
      token,
      campus: campusResult.data.campus,
      role: membership?.role ?? campusResult.data.role,
      user: meResult.data.data.user,
      roleAssignments: meResult.data.data.roleAssignments,
      permissions: new Set(
        permissionsResult.ok ? permissionsResult.data.permissions : [],
      ),
      permissionsLoaded: permissionsResult.ok,
    };
  },
);