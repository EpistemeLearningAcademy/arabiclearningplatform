import Link from "next/link";
import {
  AcademicContextPanel,
  type AcademicPanelState,
} from "../../../components/dashboard/academic-context-panel";
import { UpcomingPanel } from "../../../components/dashboard/upcoming-panel";
import { WorkspaceAreas } from "../../../components/dashboard/workspace-areas";
import { PageHeader } from "../../../components/ui/page-header";
import { InlineAlert } from "../../../components/ui/states";
import {
  buildAcademicSnapshot,
  type AcademicYearsResponse,
} from "../../../lib/academic";
import { experienceCopy, resolveExperiences } from "../../../lib/experience";
import { formatLongDate, greetingFor } from "../../../lib/format";
import {
  campusNavigation,
  campusPath,
  visibleNavigation,
} from "../../../lib/navigation";
import {
  backendGet,
  getCampusContext,
} from "../../../lib/server/campus-context";

export default async function CampusHomePage({
  params,
}: {
  params: Promise<{ campusId: string }>;
}) {
  const { campusId } = await params;
  const context = await getCampusContext(campusId);

  // The campus layout already renders the unavailable screen in this case.
  if (context.status !== "ready") return null;

  const { campus, user, permissions, permissionsLoaded } = context;
  const now = new Date();

  let academic: AcademicPanelState | null = null;

  if (permissions.has("academic.structure.read")) {
    const result = await backendGet<AcademicYearsResponse>(
      `/academic/years?schoolId=${encodeURIComponent(campus.school.id)}`,
      context.token,
    );

    academic =
      result.ok && Array.isArray(result.data.data)
        ? { kind: "ready", snapshot: buildAcademicSnapshot(result.data.data, now) }
        : { kind: "error" };
  }

  const experiences = resolveExperiences(permissions);
  const openable = new Set(
    visibleNavigation(campusNavigation, permissions).flatMap((group) =>
      group.items.map((item) => item.href),
    ),
  );

  const seen = new Set<string>();
  const areas = experiences
    .flatMap((experience) => experienceCopy[experience].areas)
    .filter((area) => !seen.has(area.title) && seen.add(area.title))
    .map((area) => ({
      title: area.title,
      description: area.description,
      href:
        area.href && openable.has(area.href)
          ? campusPath(campusId, area.href)
          : undefined,
    }));

  const firstName = user.name?.trim().split(/\s+/)[0];
  const greeting = greetingFor(now);
  const overviewHref = campusPath(campusId, "");

  return (
    <div className="space-y-8 md:space-y-10">
      <PageHeader
        eyebrow={`${campus.name} · ${formatLongDate(now)}`}
        title={firstName ? `${greeting}, ${firstName}.` : `${greeting}.`}
        description={experienceCopy[experiences[0]].description}
      />

      {!permissionsLoaded && (
        <InlineAlert tone="warning">
          Your permissions could not be loaded, so some pages may be hidden.{" "}
          <Link href={overviewHref} className="font-semibold underline">
            Reload
          </Link>
        </InlineAlert>
      )}

      {academic && (
        <section
          aria-label="Academic overview"
          className={`grid gap-6 ${
            academic.kind === "ready" ? "xl:grid-cols-[1.6fr_1fr]" : ""
          }`}
        >
          <AcademicContextPanel
            state={academic}
            yearsHref={campusPath(campusId, "/academic/years")}
            reloadHref={overviewHref}
          />
          {academic.kind === "ready" && (
            <UpcomingPanel items={academic.snapshot.upcoming} />
          )}
        </section>
      )}

      <WorkspaceAreas areas={areas} />
    </div>
  );
}