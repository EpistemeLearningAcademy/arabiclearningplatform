"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { campusPath, type NavGroup } from "../../lib/navigation";

export function PageJump({
  campusId,
  navigation,
}: {
  campusId: string;
  navigation: NavGroup[];
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");

  const entries = useMemo(
    () =>
      navigation.flatMap((group) =>
        group.items.map((item) => ({
          ...item,
          group: group.heading ?? "Workspace",
        })),
      ),
    [navigation],
  );

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return entries;
    return entries.filter((entry) =>
      `${entry.label} ${entry.group}`.toLowerCase().includes(needle),
    );
  }, [entries, query]);

  function show() {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    setQuery("");
    dialog.showModal();
  }

  function hide() {
    dialogRef.current?.close();
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        const dialog = dialogRef.current;
        if (dialog && !dialog.open) {
          setQuery("");
          dialog.showModal();
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const first = results[0];
    if (!first) return;
    hide();
    router.push(campusPath(campusId, first.href));
  }

  return (
    <>
      <button
        type="button"
        onClick={show}
        aria-haspopup="dialog"
        aria-label="Jump to a page"
        className="flex size-11 items-center justify-center gap-2 rounded-md border border-line bg-white text-sm text-muted transition-colors hover:border-brand hover:text-brand md:size-10 lg:h-10 lg:w-64 lg:justify-start lg:px-3"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-5 shrink-0 lg:size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <span className="hidden lg:inline">Jump to a page…</span>
        <kbd className="ml-auto hidden rounded-sm border border-line px-1.5 py-0.5 text-[11px] font-semibold text-muted lg:inline">
          Ctrl K
        </kbd>
      </button>

      <dialog
        ref={dialogRef}
        aria-label="Jump to a page"
        onClick={(event) => {
          if (event.target === event.currentTarget) hide();
        }}
        className="mx-auto mb-auto mt-[10vh] w-[min(32rem,calc(100vw-2rem))] rounded-md border border-line bg-white p-0 text-ink backdrop:bg-ink/40"
      >
        <form onSubmit={onSubmit} className="border-b border-line p-4">
          <label htmlFor="page-jump-input" className="sr-only">
            Jump to a page
          </label>
          <input
            id="page-jump-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search pages you can open"
            autoComplete="off"
            className="min-h-12 w-full rounded-md border border-line bg-white px-4 py-3 text-base text-ink outline-none transition-colors placeholder:text-muted focus:border-brand"
          />
        </form>

        <div className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted">
              No matching pages.
            </p>
          ) : (
            <ul>
              {results.map((entry) => (
                <li key={`${entry.group}-${entry.label}`}>
                  <Link
                    href={campusPath(campusId, entry.href)}
                    onClick={hide}
                    className="flex min-h-11 items-center justify-between gap-3 rounded-md px-3 text-sm font-medium text-ink-soft transition-colors hover:bg-brand-tint hover:text-brand"
                  >
                    {entry.label}
                    <span className="text-xs font-normal text-muted">
                      {entry.group}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="border-t border-line px-5 py-3 text-xs text-muted">
          Searching students, staff and records will arrive with those modules.
        </p>
      </dialog>
    </>
  );
}