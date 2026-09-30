"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { campusPath, isActivePath, type NavItem } from "../../lib/navigation";

const tabClass =
  "relative flex min-h-14 w-full items-center justify-center px-1 text-center text-[13px] font-semibold leading-4 transition-colors";

export function BottomNav({
  campusId,
  tabs,
  overflow,
  menuOpen,
  onOpenMenu,
}: {
  campusId: string;
  tabs: NavItem[];
  overflow: boolean;
  menuOpen: boolean;
  onOpenMenu: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="flex">
        {tabs.map((item) => {
          const active = isActivePath(pathname, campusId, item.href);

          return (
            <li key={item.label} className="min-w-0 flex-1">
              <Link
                href={campusPath(campusId, item.href)}
                aria-current={active ? "page" : undefined}
                className={`${tabClass} ${active ? "text-brand" : "text-ink-soft"}`}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-5 top-0 h-0.5 bg-gold"
                  />
                )}
                {item.label}
              </Link>
            </li>
          );
        })}

        {overflow && (
          <li className="min-w-0 flex-1">
            <button
              type="button"
              onClick={onOpenMenu}
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              className={`${tabClass} text-ink-soft`}
            >
              Menu
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
}