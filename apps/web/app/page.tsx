"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

type Campus = {
  id: string;
  name: string;
  slug: string;
  role: string;
  school: { id: string; name: string; slug: string };
};

export default function HomePage() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function loadCampuses() {
    const response = await fetch("/api/campuses", { cache: "no-store" });
    if (response.status === 401) {
      setSignedIn(false);
      setCampuses([]);
      return;
    }
    const result = (await response.json()) as { campuses?: Campus[]; error?: string };
    if (!response.ok) throw new Error(result.error ?? "Could not load your campuses.");
    setCampuses(result.campuses ?? []);
    setSignedIn(true);
  }

  useEffect(() => {
    loadCampuses()
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : "Could not connect to Greenfield.");
      })
      .finally(() => setCheckingSession(false));
  }, []);

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Sign-in failed.");
      setPassword("");
      await loadCampuses();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Your session could not be ended.");
      setSignedIn(false);
      setCampuses([]);
      setPassword("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not sign out. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-canvas lg:grid lg:grid-cols-[minmax(20rem,0.88fr)_minmax(0,1.12fr)]">
      <aside className="flex min-h-64 flex-col justify-between bg-brand px-6 py-7 text-white sm:px-10 sm:py-9 lg:min-h-screen lg:px-14 lg:py-11">
        <Link href="/" aria-label="Greenfield School Platform home" className="inline-flex w-fit items-center gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
          <span className="flex size-10 items-center justify-center border border-white/30 text-sm font-semibold text-white">G</span>
          <span>
            <span className="block text-xs font-bold uppercase text-white">Greenfield</span>
            <span className="mt-0.5 block text-xs text-white/70">School Platform</span>
          </span>
        </Link>

        <div className="max-w-lg py-10 lg:py-20">
          <p className="text-xs font-semibold uppercase text-[#dfc98f]">Schools learning platform</p>
          <h1 className="font-display mt-4 max-w-md text-4xl font-medium leading-tight text-white sm:text-5xl">
            Greenfield School Platform
          </h1>
          <p className="mt-5 max-w-md text-sm leading-6 text-white/75 sm:text-base">
            A considered workspace for the people and campuses that make Greenfield.
          </p>
          <div className="mt-8 h-px w-16 bg-gold" aria-hidden="true" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-white/60">Greenfield Schools</p>
          <Link
            href="/school"
            className="text-xs font-semibold text-white underline decoration-gold underline-offset-4 transition-colors hover:text-[#ead7a3] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            Visit school website
          </Link>
        </div>
      </aside>

      <section className="flex min-h-[28rem] items-center justify-center px-5 py-10 sm:px-10 lg:min-h-screen lg:px-14">
        <div className="w-full max-w-xl">
          {checkingSession ? (
            <div role="status" aria-live="polite" className="space-y-4">
              <span className="sr-only">Checking your sign-in</span>
              <div className="h-3 w-28 animate-pulse rounded-sm bg-slate-200" />
              <div className="h-9 w-64 max-w-full animate-pulse rounded-sm bg-slate-200" />
              <div className="h-24 rounded-md border border-line bg-white" />
            </div>
          ) : signedIn ? (
            <div>
              <p className="text-xs font-semibold uppercase text-gold-deep">Workspace selection</p>
              <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="font-display text-3xl font-medium leading-tight text-ink sm:text-4xl">Your campuses</h2>
                  <p className="mt-2 text-sm leading-6 text-muted">Choose a campus to continue.</p>
                </div>
                <button
                  className="min-h-10 rounded-md px-3 text-sm font-semibold text-ink-soft transition-colors hover:bg-brand-tint hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-deep disabled:opacity-50"
                  disabled={busy}
                  onClick={handleSignOut}
                  type="button"
                >
                  Sign out
                </button>
              </div>

              {campuses.length === 0 ? (
                <div className="mt-7 rounded-md border border-line bg-white p-5">
                  <h3 className="text-sm font-semibold text-ink">No campus access yet</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">Your account is active, but it is not a member of a campus. Ask a school administrator to grant access.</p>
                </div>
              ) : (
                <ul className="mt-7 divide-y divide-line border-y border-line">
                  {campuses.map((campus) => (
                    <li key={campus.id}>
                      <Link
                        href={`/campuses/${encodeURIComponent(campus.id)}`}
                        className="group flex min-h-20 items-center justify-between gap-4 py-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-deep"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-medium text-muted">{campus.school.name}</span>
                          <span className="mt-1 block truncate text-base font-semibold text-ink transition-colors group-hover:text-brand">{campus.name}</span>
                          <span className="mt-1 block truncate text-xs text-muted">{campus.slug}</span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="block text-xs font-semibold text-brand">{campus.role.replaceAll("_", " ").toLowerCase()}</span>
                          <span aria-hidden="true" className="mt-1 block text-right text-muted transition-transform group-hover:translate-x-1">→</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {error && <p role="alert" className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
            </div>
          ) : (
            <div>
              <p className="text-xs font-semibold uppercase text-gold-deep">Account access</p>
              <h2 className="font-display mt-3 text-3xl font-medium leading-tight text-ink sm:text-4xl">Sign in</h2>
              <p className="mt-2 text-sm leading-6 text-muted">Use the account provided by your school.</p>

              <form className="mt-8 space-y-5" onSubmit={handleSignIn}>
                <label className="block text-sm font-semibold text-ink-soft">
                  Email address
                  <input
                    autoComplete="username"
                    className="mt-2 min-h-12 w-full rounded-md border border-line bg-white px-4 py-3 text-base text-ink outline-none transition-colors placeholder:text-muted focus:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-deep"
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    type="email"
                    value={email}
                  />
                </label>
                <label className="block text-sm font-semibold text-ink-soft">
                  Password
                  <input
                    autoComplete="current-password"
                    className="mt-2 min-h-12 w-full rounded-md border border-line bg-white px-4 py-3 text-base text-ink outline-none transition-colors placeholder:text-muted focus:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-deep"
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    type="password"
                    value={password}
                  />
                </label>
                {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
                <button
                  className="min-h-12 w-full rounded-md bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-deep disabled:cursor-wait disabled:opacity-60"
                  disabled={busy}
                  type="submit"
                >
                  {busy ? "Signing in…" : "Sign in"}
                </button>
              </form>
              <p className="mt-6 border-t border-line pt-4 text-xs leading-5 text-muted">Your sign-in is protected by your school account.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
