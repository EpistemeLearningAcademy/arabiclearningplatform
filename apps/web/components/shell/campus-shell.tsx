"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { bottomTabs } from "../../lib/navigation";
import { BottomNav } from "./bottom-nav";
import { CampusHeader } from "./campus-header";
import { CampusSidebar } from "./campus-sidebar";
import type { ShellProps } from "./types";

export function CampusShell({
  children,
  campusId,
  campusName,
  schoolName,
  user,
  navigation,
}: ShellProps & { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);

  const { tabs, overflow } = bottomTabs(navigation);
  const hasBottomBar = tabs.length >= 2;

  useEffect(() => {
    if (!drawerOpen) {
      if (wasOpen.current) menuButtonRef.current?.focus();
      wasOpen.current = false;
      return undefined;
    }

    wasOpen.current = true;
    const firstFocusable = drawerRef.current?.querySelector<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    firstFocusable?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const media = window.matchMedia("(min-width: 1024px)");

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDrawerOpen(false);
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) {
        event.preventDefault();
        drawerRef.current?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    function onBreakpoint(event: MediaQueryListEvent) {
      if (event.matches) setDrawerOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    media.addEventListener("change", onBreakpoint);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      media.removeEventListener("change", onBreakpoint);
    };
  }, [drawerOpen]);

  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <a
        href="#main-content"
        className="sr-only rounded-md bg-white px-4 py-2 text-sm font-semibold text-brand focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50"
      >
        Skip to content
      </a>

      <div inert={drawerOpen}>
        <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-line lg:block">
          <CampusSidebar
            campusId={campusId}
            campusName={campusName}
            schoolName={schoolName}
            navigation={navigation}
          />
        </aside>

        <div className="lg:pl-64">
          <CampusHeader
            campusId={campusId}
            campusName={campusName}
            schoolName={schoolName}
            user={user}
            navigation={navigation}
            drawerOpen={drawerOpen}
            onOpenMenu={() => setDrawerOpen(true)}
            menuButtonRef={menuButtonRef}
          />

          <main
            id="main-content"
            tabIndex={-1}
            className={`mx-auto w-full max-w-[1200px] px-4 pt-6 outline-none sm:px-6 md:px-8 md:pb-12 md:pt-8 ${
              hasBottomBar
                ? "pb-[calc(5.5rem_+_env(safe-area-inset-bottom))]"
                : "pb-10"
            }`}
          >
            {children}
          </main>
        </div>

        {hasBottomBar && (
          <BottomNav
            campusId={campusId}
            tabs={tabs}
            overflow={overflow}
            menuOpen={drawerOpen}
            menuButtonRef={menuButtonRef}
            onOpenMenu={() => setDrawerOpen(true)}
          />
        )}
      </div>

      {drawerOpen && (
        <div
          id="mobile-navigation"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          className="fixed inset-0 z-40 lg:hidden"
        >
          <div
            className="absolute inset-0 bg-ink/40"
            aria-hidden="true"
            onClick={() => setDrawerOpen(false)}
          />
          <div
            ref={drawerRef}
            tabIndex={-1}
            className="absolute inset-y-0 left-0 w-[min(20rem,88vw)] border-r border-line bg-white outline-none"
          >
            <CampusSidebar
              campusId={campusId}
              campusName={campusName}
              schoolName={schoolName}
              navigation={navigation}
              onNavigate={() => setDrawerOpen(false)}
              onClose={() => setDrawerOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}