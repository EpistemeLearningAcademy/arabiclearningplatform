"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

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
      await fetch("/api/auth/logout", { method: "POST" });
      setSignedIn(false);
      setCampuses([]);
      setPassword("");
    } catch {
      setError("Could not sign out. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f7f4] px-5 py-8 text-slate-900 sm:px-8 sm:py-12">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col">
        <header className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-800 text-lg font-bold text-white">G</div>
          <div>
            <p className="text-sm font-bold tracking-wide text-emerald-950">GREENFIELD</p>
            <p className="text-xs text-slate-500">Schools learning platform</p>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          <div className="max-w-xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Learning, connected</p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-5xl">A calmer place to learn and grow.</h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">Sign in to reach your Greenfield campus and the people who help you thrive.</p>
            <div className="mt-10 flex flex-wrap gap-3 text-sm text-slate-600">
              <span className="rounded-full border border-emerald-100 bg-white px-4 py-2">One school, many campuses</span>
              <span className="rounded-full border border-emerald-100 bg-white px-4 py-2">A welcoming space to learn</span>
            </div>
          </div>

          <div className="w-full rounded-3xl border border-emerald-100 bg-white p-6 shadow-[0_24px_70px_-36px_rgba(15,75,45,0.35)] sm:p-9">
            {checkingSession ? (
              <div className="py-12 text-center text-sm text-slate-500" role="status">Checking your sign-in…</div>
            ) : signedIn ? (
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-emerald-700">Greenfield</p>
                    <h2 className="mt-1 text-2xl font-semibold tracking-tight">Choose a campus</h2>
                    <p className="mt-2 text-sm text-slate-500">You’ll only see campuses where you have access.</p>
                  </div>
                  <button className="rounded-full px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50" disabled={busy} onClick={handleSignOut} type="button">Sign out</button>
                </div>

                {campuses.length === 0 ? (
                  <p className="mt-8 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">Your account doesn’t have a campus membership yet. Ask your school administrator for help.</p>
                ) : (
                  <div className="mt-7 space-y-3">
                    {campuses.map((campus) => (
                      <Link
                        className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50/50 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                        href={`/campuses/${campus.id}`}
                        key={campus.id}
                      >
                        <span>
                          <span className="block text-xs font-medium uppercase tracking-wide text-emerald-700">{campus.school.name}</span>
                          <span className="mt-1 block font-semibold text-slate-900">{campus.name}</span>
                          <span className="mt-1 block text-sm text-slate-500">{campus.slug}</span>
                        </span>
                        <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100">{campus.role.replaceAll("_", " ").toLowerCase()}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-emerald-700">Welcome back</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">Sign in to Greenfield</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">Use the email and password given to you by your school.</p>
                <form className="mt-7 space-y-5" onSubmit={handleSignIn}>
                  <label className="block text-sm font-medium text-slate-700">
                    Email address
                    <input autoComplete="username" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Password
                    <input autoComplete="current-password" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
                  </label>
                  {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{error}</p>}
                  <button className="w-full rounded-xl bg-emerald-800 px-5 py-3.5 font-semibold text-white transition hover:bg-emerald-900 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-wait disabled:opacity-60" disabled={busy} type="submit">{busy ? "Signing in…" : "Sign in"}</button>
                </form>
                <p className="mt-6 text-center text-xs leading-5 text-slate-400">Your sign-in is protected by your school account.</p>
              </div>
            )}
            {error && signedIn && <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{error}</p>}
          </div>
        </section>

        <footer className="border-t border-emerald-100 pt-5 text-xs text-slate-500">Greenfield · A shared learning space across campuses</footer>
      </div>
    </main>
  );
}
