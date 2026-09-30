import type { UpcomingDate } from "../../lib/academic";
import { formatDate } from "../../lib/format";
import { Panel } from "../ui/panel";

export function UpcomingPanel({ items }: { items: UpcomingDate[] }) {
  return (
    <Panel title="Coming up" description="From your configured terms.">
      {items.length === 0 ? (
        <p className="text-sm leading-6 text-muted">
          No upcoming term dates. They will appear here once terms are
          configured.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {items.map((item) => (
            <li
              key={item.key}
              className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{item.label}</p>
                <p className="mt-0.5 text-xs text-muted">{item.detail}</p>
              </div>
              <time
                dateTime={item.date.toISOString()}
                className="shrink-0 text-sm text-ink-soft"
              >
                {formatDate(item.date)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}