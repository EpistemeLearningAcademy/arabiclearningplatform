"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { publicNavigation } from "../../lib/public-site-content";

function isCurrentPage(pathname: string, href: string) {
  if (href === "/school") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SchoolHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (!open) {
      if (wasOpen.current) menuButtonRef.current?.focus();
      wasOpen.current = false;
      return undefined;
    }

    wasOpen.current = true;
    const firstFocusable = drawerRef.current?.querySelector<HTMLElement>(
      'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
    );
    firstFocusable?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
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

    const desktop = window.matchMedia("(min-width: 1280px)");
    function onBreakpoint(event: MediaQueryListEvent) {
      if (event.matches) setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onBreakpoint);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onBreakpoint);
    };
  }, [open]);

  useEffect(() => {
    if (open) setOpen(false);
  }, [pathname]);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line bg-white pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex min-h-16 max-w-[1600px] items-center justify-between gap-5 px-5 sm:px-8 xl:px-10">
          <Link
            href="/school"
            aria-label="Greenfield Schools home"
            className="flex shrink-0 items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-deep"
          >
            <span className="flex size-9 items-center justify-center rounded-sm bg-brand text-sm font-semibold text-white">
              G
            </span>
            <span>
              <span className="block text-xs font-bold uppercase text-brand">
                Greenfield Schools
              </span>
              <span className="font-display mt-0.5 block text-xs text-gold-deep">
                Arise and Ascend
              </span>
            </span>
          </Link>

          <nav
            aria-label="School website"
            className="hidden min-w-0 items-center justify-end gap-x-3 xl:flex"
          >
            {publicNavigation.map((item) => {
              const active = isCurrentPage(pathname, item.href);
              const isPortal = item.href === "/";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={
                    isPortal
                      ? "ml-1 inline-flex min-h-10 shrink-0 items-center rounded-sm bg-brand px-3 text-xs font-semibold text-white transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-deep"
                      : `whitespace-nowrap text-xs font-medium transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-deep ${active ? "text-brand" : "text-ink-soft"}`
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <button
            ref={menuButtonRef}
            type="button"
            aria-label={open ? "Close school navigation" : "Open school navigation"}
            aria-expanded={open}
            aria-controls="school-mobile-navigation"
            onClick={() => setOpen((value) => !value)}
            className="flex size-11 shrink-0 items-center justify-center rounded-sm border border-line text-brand transition-colors hover:bg-brand-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-deep xl:hidden"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-[60] xl:hidden">
          <button
            type="button"
            aria-label="Close school navigation"
            className="absolute inset-0 bg-ink/40"
            onClick={closeMenu}
          />
          <aside
            ref={drawerRef}
            id="school-mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="School navigation"
            tabIndex={-1}
            className="absolute inset-y-0 right-0 flex w-[min(25rem,90vw)] flex-col overflow-y-auto bg-white pb-[env(safe-area-inset-bottom)] outline-none"
          >
            <div className="flex min-h-16 items-center justify-between border-b border-line px-5">
              <p className="text-xs font-bold uppercase text-brand">Greenfield Schools</p>
              <button
                type="button"
                onClick={closeMenu}
                aria-label="Close school navigation"
                className="flex size-11 items-center justify-center rounded-sm text-ink-soft hover:bg-brand-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-deep"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
            <nav aria-label="School website" className="flex-1 px-5 py-4">
              <ul className="divide-y divide-line">
                {publicNavigation.map((item) => {
                  const active = isCurrentPage(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={closeMenu}
                        aria-current={active ? "page" : undefined}
                        className={`flex min-h-12 items-center justify-between py-2 text-sm font-medium transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-brand ${active ? "text-brand" : "text-ink-soft"}`}
                      >
                        {item.label}
                        {item.href === "/" && <span aria-hidden="true">↗</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <p className="font-display border-t border-line px-5 py-5 text-sm text-gold-deep">
              Arise and Ascend
            </p>
          </aside>
        </div>
      )}
    </>
  );
}
