"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "../ui/avatar";
import type { ShellUser } from "./types";
import { popoverPanelClass, usePopover } from "./use-popover";

export function AccountMenu({
  user,
  campusName,
}: {
  user: ShellUser;
  campusName: string;
}) {
  const router = useRouter();
  const { open, setOpen, containerRef, triggerRef } = usePopover();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function signOut() {
    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Your session could not be ended.");

      router.replace("/");
      router.refresh();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not sign out. Please try again.",
      );
      setBusy(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Account menu for ${user.name}`}
        aria-expanded={open}
        aria-controls="account-panel"
        onClick={() => setOpen((current) => !current)}
        className="flex size-11 items-center justify-center rounded-full md:size-10"
      >
        <Avatar initials={user.initials} />
      </button>

      {open && (
        <div id="account-panel" className={popoverPanelClass}>
          <div className="border-b border-line p-4">
            <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
            <p className="mt-2 text-xs text-ink-soft">
              {user.roleLabel} · {campusName}
            </p>
          </div>

          <div className="p-2">
            <Link
              href="/"
              className="flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-ink-soft transition-colors hover:bg-brand-tint hover:text-brand"
            >
              Switch campus
            </Link>
            <button
              type="button"
              onClick={signOut}
              disabled={busy}
              className="flex min-h-11 w-full items-center rounded-md px-3 text-left text-sm font-medium text-ink-soft transition-colors hover:bg-brand-tint hover:text-brand disabled:opacity-50"
            >
              {busy ? "Signing out…" : "Sign out"}
            </button>
            {error && (
              <p role="alert" className="px-3 py-2 text-xs text-red-700">
                {error}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}