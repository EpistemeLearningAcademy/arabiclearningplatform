"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { RefObject } from "react";
import {
  campusPath,
  resolvePageContext,
  type NavGroup,
} from "../../lib/navigation";
import { AccountMenu } from "./account-menu";
import { NotificationsMenu } from "./notifications-menu";
import { PageJump } from "./page-jump";
import type { ShellUser } from "./types";

type Crumb = { label: string; href?: string };

export function CampusHeader({
  campusId,
  campusName,
  schoolName,
  user,
  navigation,
  drawerOpen,
  onOpenMenu,
  menuButtonRef,
}: {
  campusId: string;
  campusName: string;
  schoolName: string;
  user: ShellUser;
  navigation: NavGroup[];
  drawerOpen: boolean;
  onOpenMenu: () => void;
  menuButtonRef: RefObject<HTMLButtonElement | null>;
}) {
  const pathname = usePathname();
  const context = resolvePageContext(navigation, campusId, pathname);

  const crumbs: Crumb[] = [{ label: campusName, href: campusPath(campusId, "") }];
  if (context?.group) crumbs.push({ label: context.group });
  if (context) crumbs.push({ label: context.item.label });

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white pt-[env(safe-area-inset-top)]">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6 md:h-16 md:px-8">
        <button
          ref={menuButtonRef}
          type="button"
          onClick={onOpenMenu}
          aria-label="Open navigation"
          aria-expanded={drawerOpen}
          aria-controls="mobile-navigation"
          className="hidden size-10 shrink-0 items-center justify-center rounded-md border border-line text-ink-soft transition-colors hover:border-brand hover:text-brand md:flex lg:hidden"
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
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-3 md:hidden">
          <span
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-brand text-sm font-semibold text-white"
          >
            G
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-ink">
              {campusName}
            </span>
            <span className="block truncate text-xs text-muted">{schoolName}</span>
          </span>
        </div>

        <nav aria-label="Breadcrumb" className="hidden min-w-0 flex-1 md:block">
          <ol className="flex min-w-0 items-center gap-2 text-sm">
            {crumbs.map((crumb, index) => {
              const last = index === crumbs.length - 1;

              return (
                <li
                  key={`${crumb.label}-${index}`}
                  className="flex min-w-0 items-center gap-2"
                >
                  {index > 0 && (
                    <span aria-hidden="true" className="text-line">
                      /
                    </span>
                  )}

                  {crumb.href && !last ? (
                    <Link
                      href={crumb.href}
                      className="truncate text-muted hover:text-brand"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span
                      aria-current={last ? "page" : undefined}
                      className={`truncate ${
                        last ? "font-semibold text-ink" : "text-muted"
                      }`}
                    >
                      {crumb.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <PageJump campusId={campusId} navigation={navigation} />
          <NotificationsMenu />
          <AccountMenu user={user} campusName={campusName} />
        </div>
      </div>
    </header>
  );
}