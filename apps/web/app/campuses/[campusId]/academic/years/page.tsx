"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Campus = {
  id: string;
  name: string;
  slug: string;
  school: {
    id: string;
    name: string;
    slug: string;
  };
};

type Term = {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
  sequence: number;
};

type AcademicYear = {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
  terms: Term[];
};

type AcademicYearsResponse = {
  data: AcademicYear[];
  page: {
    limit: number;
    nextCursor: string | null;
  };
};

type PermissionsResponse = {
  permissions: string[];
};

function formatDate(value: string) {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function toIsoDate(date: string) {
  return date ? new Date(`${date}T00:00:00`).toISOString() : "";
}

export default function AcademicYearsPage({
  params,
}: {
  params: Promise<{ campusId: string }>;
}) {
  const [campusId, setCampusId] = useState("");
  const [campus, setCampus] = useState<Campus | null>(null);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  useEffect(() => {
    let active = true;

    params.then(({ campusId: resolvedCampusId }) => {
      if (active) setCampusId(resolvedCampusId);
    });

    return () => {
      active = false;
    };
  }, [params]);

  useEffect(() => {
    if (!campusId) return;

    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const permissionResponse = await fetch(
          `/api/campuses/${encodeURIComponent(campusId)}/permissions`,
          { cache: "no-store" },
        );

        if (!permissionResponse.ok) {
          throw new Error("Campus permissions could not be loaded.");
        }

        const permissionData =
          (await permissionResponse.json()) as PermissionsResponse;

        const campusesResponse = await fetch("/api/campuses", {
          cache: "no-store",
        });

        if (!campusesResponse.ok) {
          throw new Error("Campus information could not be loaded.");
        }

        const campusesData = (await campusesResponse.json()) as {
          campuses: Array<Campus & { role: string }>;
        };

        const currentCampus = campusesData.campuses.find(
          (item) => item.id === campusId,
        );

        if (!currentCampus) {
          throw new Error("The selected campus could not be found.");
        }

        const yearsResponse = await fetch(
          `/api/backend/academic/years?schoolId=${encodeURIComponent(
            currentCampus.school.id,
          )}`,
          { cache: "no-store" },
        );

        if (!yearsResponse.ok) {
          throw new Error("Academic years could not be loaded.");
        }

        const yearsData =
          (await yearsResponse.json()) as AcademicYearsResponse;

        if (!active) return;

        setCampus(currentCampus);
        setPermissions(permissionData.permissions);
        setYears(yearsData.data);
      } catch (err) {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading academic years.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [campusId]);

  const canCreate = useMemo(
    () =>
      permissions.includes("academic.structure.write") ||
      permissions.includes("academic.manage") ||
      permissions.includes("campus.manage"),
    [permissions],
  );

  async function reloadYears() {
    if (!campus) return;

    const response = await fetch(
      `/api/backend/academic/years?schoolId=${encodeURIComponent(
        campus.school.id,
      )}`,
      { cache: "no-store" },
    );

    if (!response.ok) {
      throw new Error("Academic years could not be refreshed.");
    }

    const data = (await response.json()) as AcademicYearsResponse;
    setYears(data.data);
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!campus) return;

    setCreating(true);
    setError("");
    setSuccess("");

    try {
      if (!name.trim()) {
        throw new Error("Academic year name is required.");
      }

      if (!startsAt || !endsAt) {
        throw new Error("Please provide both start and end dates.");
      }

      if (new Date(startsAt) >= new Date(endsAt)) {
        throw new Error("The end date must be after the start date.");
      }

      const response = await fetch("/api/backend/academic/years", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schoolId: campus.school.id,
          name: name.trim(),
          startsAt: toIsoDate(startsAt),
          endsAt: toIsoDate(endsAt),
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);

        throw new Error(
          body?.message ||
            body?.error ||
            "The academic year could not be created.",
        );
      }

      await reloadYears();

      setName("");
      setStartsAt("");
      setEndsAt("");
      setShowForm(false);
      setSuccess("Academic year created successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "The academic year could not be created.",
      );
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div>
        <div className="mx-auto max-w-[1500px]">
          <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
          <div className="mt-4 h-10 w-72 animate-pulse rounded bg-slate-200" />
          <div className="mt-3 h-5 w-[28rem] max-w-full animate-pulse rounded bg-slate-200" />

          <div className="mt-10 grid gap-5">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error && !campus) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-[#0b3d2e] text-lg font-bold text-white">
            G
          </div>

          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-slate-950">
            Academic workspace unavailable
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">{error}</p>

          <Link
            href={`/campuses/${campusId}`}
            className="mt-6 inline-flex rounded-xl bg-[#0b3d2e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#082f24]"
          >
            Return to campus
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div>
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href={`/campuses/${campusId}`}
              className="text-sm font-semibold text-[#0b3d2e] hover:underline"
            >
              ← Campus overview
            </Link>

            <p className="mt-6 text-sm font-medium text-[#a27c2e]">
              {campus?.school.name}
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Academic Years
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Manage the academic years and their associated terms for{" "}
              {campus?.school.name}.
            </p>
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={() => {
                setShowForm((current) => !current);
                setError("");
                setSuccess("");
              }}
              className="inline-flex items-center rounded-xl bg-[#0b3d2e] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#082f24]"
            >
              {showForm ? "Close form" : "+ New academic year"}
            </button>
          )}
        </div>

        {showForm && canCreate && (
          <section className="mt-8 rounded-2xl border border-[#d9e4dd] bg-white p-6 shadow-sm">
            <div>
              <p className="text-lg font-semibold text-slate-950">
                Create academic year
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Add a new academic year to the school structure.
              </p>
            </div>

            <form
              onSubmit={handleCreate}
              className="mt-6 grid gap-5 sm:grid-cols-3"
            >
              <label>
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Name
                </span>

                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="2026/2027 Academic Session"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#0b3d2e] focus:ring-2 focus:ring-[#0b3d2e]/10"
                />
              </label>

              <label>
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Start date
                </span>

                <input
                  type="date"
                  value={startsAt}
                  onChange={(event) => setStartsAt(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#0b3d2e] focus:ring-2 focus:ring-[#0b3d2e]/10"
                />
              </label>

              <label>
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  End date
                </span>

                <input
                  type="date"
                  value={endsAt}
                  onChange={(event) => setEndsAt(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#0b3d2e] focus:ring-2 focus:ring-[#0b3d2e]/10"
                />
              </label>

              <div className="flex justify-end sm:col-span-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-[#0b3d2e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#082f24] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create academic year"}
                </button>
              </div>
            </form>
          </section>
        )}

        {error && campus && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {success}
          </div>
        )}

        <section className="mt-8">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Academic structure
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {years.length} academic year{years.length === 1 ? "" : "s"}{" "}
              configured
            </p>
          </div>

          {years.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#f0f4f1] text-[#0b3d2e]">
                +
              </div>

              <h2 className="mt-5 text-lg font-semibold text-slate-950">
                No academic years yet
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Create the first academic year to begin building the school's
                academic structure.
              </p>

              {canCreate && (
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="mt-6 rounded-xl bg-[#0b3d2e] px-5 py-3 text-sm font-semibold text-white"
                >
                  Create first academic year
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-5">
              {years.map((year) => (
                <article
                  key={year.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                    <div>
                      <p className="text-xl font-semibold text-slate-950">
                        {year.name}
                      </p>

                      <p className="mt-2 text-sm text-slate-500">
                        {formatDate(year.startsAt)} — {formatDate(year.endsAt)}
                      </p>
                    </div>

                    <span className="inline-flex w-fit rounded-full bg-[#f0f4f1] px-3 py-1 text-xs font-semibold text-[#0b3d2e]">
                      {year.terms.length} term
                      {year.terms.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="mt-6 border-t border-slate-100 pt-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Terms
                    </p>

                    {year.terms.length === 0 ? (
                      <p className="mt-3 text-sm text-slate-500">
                        No terms have been configured for this academic year
                        yet.
                      </p>
                    ) : (
                      <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        {year.terms
                          .slice()
                          .sort((a, b) => a.sequence - b.sequence)
                          .map((term) => (
                            <div
                              key={term.id}
                              className="rounded-xl border border-slate-200 bg-[#fafcfb] p-4"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-slate-800">
                                  {term.name}
                                </p>

                                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                                  Term {term.sequence}
                                </span>
                              </div>

                              <p className="mt-2 text-xs leading-5 text-slate-500">
                                {formatDate(term.startsAt)} —{" "}
                                {formatDate(term.endsAt)}
                              </p>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}