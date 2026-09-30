import Link from "next/link";
import type { AcademicSnapshot } from "../../lib/academic";
import { formatDate } from "../../lib/format";
import { buttonClasses } from "../ui/button";
import { Panel } from "../ui/panel";
import { EmptyState, InlineAlert } from "../ui/states";

export type AcademicPanelState =
  | { kind: "error" }
  | { kind: "ready"; snapshot: AcademicSnapshot };

export function AcademicContextPanel({
  state,
  yearsHref,
  reloadHref,
}: {
  state: AcademicPanelState;
  yearsHref: string;
  reloadHref: string;
}) {
  if (state.kind === "error") {
    return (
      <Panel title="This term">
        <InlineAlert>
          Academic information could not be loaded.{" "}
          <Link href={reloadHref} className="font-semibold underline">
            Try again
          </Link>
        </InlineAlert>
      </Panel>
    );
  }

  const { snapshot } = state;
  const { currentYear, currentTerm, termProgress, nextTerm } = snapshot;

  if (snapshot.yearCount === 0) {
    return (
      <Panel title="This term">
        <EmptyState
          title="No academic years configured"
          description="Set up the first academic year to give the school a calendar."
          action={
            <Link href={yearsHref} className={buttonClasses("primary")}>
              Set up academic years
            </Link>
          }
        />
      </Panel>
    );
  }

  if (!currentYear) {
    return (
      <Panel title="This term">
        <EmptyState
          title="No academic year is in session"
          description={
            nextTerm
              ? `${nextTerm.name} (${nextTerm.yearName}) begins on ${formatDate(nextTerm.startsAt)}.`
              : "Review the academic calendar to make sure the next year is configured."
          }
          action={
            <Link href={yearsHref} className={buttonClasses("secondary")}>
              Review academic years
            </Link>
          }
        />
      </Panel>
    );
  }

  const stats = [
    { label: "Academic years", value: String(snapshot.yearCount) },
    { label: "Terms this year", value: String(currentYear.terms.length) },
    {
      label: "Days left in term",
      value: termProgress ? String(termProgress.remainingDays) : "—",
    },
  ];

  return (
    <Panel
      title="This term"
      action={
        <Link href={yearsHref} className={buttonClasses("ghost", "sm")}>
          Manage
        </Link>
      }
    >
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
        Academic year
      </p>
      <p className="font-display mt-1 text-2xl text-ink">{currentYear.name}</p>
      <p className="mt-1 text-sm text-muted">
        {formatDate(currentYear.startsAt)} — {formatDate(currentYear.endsAt)}
      </p>

      <div className="mt-5 border-t border-line pt-5">
        {currentTerm && termProgress ? (
          <>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-semibold text-ink">{currentTerm.name}</p>
              <p className="text-xs text-muted">
                Day {termProgress.elapsedDays} of {termProgress.totalDays}
              </p>
            </div>

            <div
              role="progressbar"
              aria-label={`${currentTerm.name} progress`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={termProgress.percent}
              className="mt-3 h-1.5 overflow-hidden rounded-sm bg-line"
            >
              <div
                className="h-full bg-brand"
                style={{ width: `${termProgress.percent}%` }}
              />
            </div>
          </>
        ) : (
          <p className="text-sm text-muted">
            Between terms.
            {nextTerm
              ? ` ${nextTerm.name} begins on ${formatDate(nextTerm.startsAt)}.`
              : " No further terms are configured."}
          </p>
        )}
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-4 border-t border-line pt-5">
        {stats.map((stat) => (
          <div key={stat.label}>
            <dt className="text-xs font-semibold text-muted">{stat.label}</dt>
            <dd className="font-display mt-1 text-2xl text-ink">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}