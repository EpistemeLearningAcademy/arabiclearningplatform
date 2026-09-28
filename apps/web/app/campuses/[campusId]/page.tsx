import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

const apiUrl = process.env.GREENFIELD_API_URL ?? "http://127.0.0.1:4000";

type CampusResponse = {
  campus: {
    id: string;
    name: string;
    slug: string;
    school: { id: string; name: string; slug: string };
  };
  role: string;
};

export default async function CampusHomePage({
  params,
}: {
  params: Promise<{ campusId: string }>;
}) {
  const { campusId } = await params;
  const token = (await cookies()).get("greenfield_session")?.value;
  if (!token) redirect("/");

  let apiResponse: Response;
  try {
    apiResponse = await fetch(
      `${apiUrl}/campuses/${encodeURIComponent(campusId)}/me`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
    );
  } catch {
    return (
      <main className="min-h-screen bg-[#f4f7f4] px-5 py-10 text-slate-900">
        <section className="mx-auto max-w-3xl rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm">
          <p className="text-lg font-semibold">Greenfield is temporarily unavailable</p>
          <p className="mt-2 text-sm text-slate-600">Please check that the school service is running, then try again.</p>
          <Link className="mt-6 inline-block font-semibold text-emerald-800 underline" href="/">Return to campus selection</Link>
        </section>
      </main>
    );
  }

  if (apiResponse.status === 401) redirect("/");
  if (apiResponse.status === 403 || apiResponse.status === 404) notFound();
  if (!apiResponse.ok) throw new Error("Campus details could not be loaded.");
  const result = (await apiResponse.json()) as CampusResponse;

  return (
    <main className="min-h-screen bg-[#f4f7f4] px-5 py-8 text-slate-900 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-800 text-lg font-bold text-white">G</div>
            <div>
              <p className="text-sm font-bold tracking-wide text-emerald-950">GREENFIELD</p>
              <p className="text-xs text-slate-500">{result.campus.school.name}</p>
            </div>
          </div>
          <Link className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-50" href="/">All campuses</Link>
        </header>

        <section className="mt-12 rounded-3xl bg-emerald-950 px-7 py-10 text-white sm:px-10 sm:py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">{result.campus.school.name}</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">{result.campus.name}</h1>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-white/10 px-4 py-2 text-sm text-emerald-50">Campus workspace</span>
            <span className="rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-950">{result.role.replaceAll("_", " ").toLowerCase()}</span>
          </div>
        </section>

        <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: "Classes", description: "Class groups and timetables will live here." },
            { title: "Learning", description: "Lessons and learning materials will live here." },
            { title: "People", description: "Staff, learners, and families will live here." },
          ].map((item) => (
            <article className="rounded-2xl border border-emerald-100 bg-white p-6" key={item.title}>
              <p className="text-lg font-semibold text-slate-900">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              <span className="mt-5 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">Coming soon</span>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
