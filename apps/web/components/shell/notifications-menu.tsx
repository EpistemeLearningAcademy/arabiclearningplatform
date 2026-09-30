"use client";

import { popoverPanelClass, usePopover } from "./use-popover";

export function NotificationsMenu() {
  const { open, setOpen, containerRef, triggerRef } = usePopover();

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        aria-controls="notifications-panel"
        onClick={() => setOpen((current) => !current)}
        className="flex size-11 items-center justify-center rounded-md border border-line bg-white text-ink-soft transition-colors hover:border-brand hover:text-brand md:size-10"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
          <path d="M10 19a2 2 0 0 0 4 0" />
        </svg>
      </button>

      {open && (
        <div id="notifications-panel" className={`${popoverPanelClass} p-5`}>
          <p className="font-display text-lg text-ink">Notifications</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Nothing to show yet. Notifications will appear here once they are
            connected to this workspace.
          </p>
        </div>
      )}
    </div>
  );
}