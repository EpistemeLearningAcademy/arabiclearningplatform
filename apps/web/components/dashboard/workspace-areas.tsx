import Link from "next/link";
import { Badge } from "../ui/badge";

export type WorkspaceAreaView = {
  title: string;
  description: string;
  /** Present only when the user can open this area today. */
  href?: string;
};

const rowClass = "flex min-h-16 items-center justify-between gap-4 px-4 py-4";

export function WorkspaceAreas({ areas }: { areas: WorkspaceAreaView[] }) {
  return (
    <section aria-labelledby="workspace-heading">
      <h2 id="workspace-heading" className="font-display text-xl text-ink">
        Your workspace
      </h2>
      <p className="mt-1 text-sm text-muted">
        What you can open now, and what is on its way.
      </p>

      <ul className="mt-4 divide-y divide-line rounded-md border border-line bg-white">
        {areas.map((area) => {
          const content = (
            <>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-ink">
                  {area.title}
                </span>
                <span className="mt-0.5 block text-sm text-muted">
                  {area.description}
                </span>
              </span>
              {area.href ? (
                <span aria-hidden="true" className="shrink-0 text-muted">
                  →
                </span>
              ) : (
                <span className="shrink-0">
                  <Badge>Not connected yet</Badge>
                </span>
              )}
            </>
          );

          return (
            <li key={area.title}>
              {area.href ? (
                <Link
                  href={area.href}
                  className={`${rowClass} transition-colors hover:bg-brand-tint`}
                >
                  {content}
                </Link>
              ) : (
                <div className={rowClass}>{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}