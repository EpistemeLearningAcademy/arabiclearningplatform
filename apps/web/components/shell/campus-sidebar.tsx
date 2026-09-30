"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { campusPath, isActivePath, type NavGroup } from "../../lib/navigation";

export function CampusSidebar({
  campusId,
  campusName,
  schoolName,
  navigation,
  onNavigate,
  onClose,
}: {
  campusId: string;
  campusName: string;
  schoolName: string;
  navigation: NavGroup[];
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-5">
        <Link
          href="/"
          onClick={onNavigate}
          aria-label="Greenfield School Platform, back to campus selection"
          className="flex min-w-0 items-center gap-3"
        >
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-brand text-sm font-semibold text-white"
          >
            G
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-bold uppercase tracking-[0.08em] text-brand">
              Greenfield
            </span>
            <span className="mt-0.5 block text-xs text-muted">School Platform</span>
          </span>
        </Link>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="flex size-11 shrink-0 items-center justify-center rounded-md text-ink-soft transition-colors hover:bg-brand-tint hover:text-brand"
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
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        )}
      </div>

      <div className="border-b border-line px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
          Campus
        </p>
        <p className="mt-1 truncate text-sm font-semibold text-ink">{campusName}</p>
        <p className="truncate text-xs text-muted">{schoolName}</p>
      </div>

      <nav aria-label="Campus" className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-6">
          {navigation.map((group, index) => (
            <div key={group.heading ?? `main-${index}`}>
              {group.heading && (
                <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                  {group.heading}
                </p>
              )}

              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActivePath(pathname, campusId, item.href);

                  return (
                    <li key={item.label}>
                      <Link
                        href={campusPath(campusId, item.href)}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={[
                          "relative flex min-h-11 items-center rounded-md px-3 text-sm transition-colors md:min-h-10",
                          active
                            ? "bg-brand-tint font-semibold text-brand before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:bg-gold"
                            : "font-medium text-ink-soft hover:bg-brand-tint hover:text-brand",
                        ].join(" ")}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      <div className="border-t border-line px-5 py-4">
        <p className="font-display text-sm text-gold-deep">Arise and Ascend</p>
      </div>
    </div>
  );
}