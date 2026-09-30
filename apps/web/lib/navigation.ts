export type NavItem = {
  label: string;
  /** Path relative to /campuses/[campusId]. An empty string is Home. */
  href: string;
  /** Visible when the user holds ANY of these permissions. Omit for everyone. */
  access?: readonly string[];
  /** False until the page exists. Unready items are the roadmap and are never shown. */
  ready: boolean;
};

export type NavGroup = {
  heading?: string;
  items: NavItem[];
};

const planned = (
  label: string,
  href: string,
  access: readonly string[],
): NavItem => ({ label, href, access, ready: false });

const structure = ["academic.structure.read", "academic.structure.manage"] as const;

export const campusNavigation: NavGroup[] = [
  { items: [{ label: "Home", href: "", ready: true }] },
  {
    heading: "Academics",
    items: [
      {
        label: "Academic Years",
        href: "/academic/years",
        access: structure,
        ready: true,
      },
      planned("Terms", "/academic/terms", structure),
      planned("Sections & Levels", "/academic/sections", structure),
      planned("Classes", "/academic/classes", structure),
      planned("Subjects", "/academic/subjects", structure),
      planned("Teacher Assignments", "/academic/teacher-assignments", [
        "academic.assignments.manage",
        "academic.structure.read",
      ]),
      planned("Enrolments", "/academic/enrolments", [
        "students.class.read",
        "students.academic.read",
      ]),
    ],
  },
  {
    heading: "People",
    items: [
      planned("Students", "/people/students", [
        "students.school.read",
        "students.campus.read",
        "students.class.read",
      ]),
      planned("Staff", "/people/staff", ["memberships.manage", "users.read"]),
      planned("Admissions", "/people/admissions", [
        "admissions.applicants.read",
        "admissions.applicants.manage",
      ]),
    ],
  },
  {
    heading: "Learning",
    items: [
      planned("Lessons", "/learning/lessons", ["lessons.assigned.manage"]),
      planned("Attendance", "/learning/attendance", ["attendance.assigned.manage"]),
      planned("Assignments", "/learning/assignments", [
        "assignments.assigned.manage",
        "assignments.self.submit",
      ]),
      planned("Assessments", "/learning/assessments", [
        "assessments.assigned.manage",
        "assessments.read",
      ]),
      planned("Results", "/learning/results", [
        "results.assigned.read",
        "results.self.read",
        "results.read",
        "results.publish",
      ]),
      planned("Resources", "/learning/resources", ["content.read"]),
    ],
  },
  {
    heading: "Family",
    items: [
      planned("My Children", "/family/children", ["students.linked.read"]),
      planned("Fees", "/family/fees", ["finance.statement.linked.read"]),
    ],
  },
  {
    heading: "Transport",
    items: [
      planned("Today's Route", "/transport/route", ["transport.assigned.read"]),
      planned("Transport", "/transport", ["transport.manage"]),
    ],
  },
  {
    heading: "Finance",
    items: [
      planned("Finance", "/finance", ["finance.read", "finance.manage"]),
      planned("Finance Reports", "/finance/reports", ["finance.reports.read"]),
    ],
  },
  {
    heading: "System",
    items: [
      planned("Activity", "/system/activity", ["audit.read"]),
      planned("Roles & Access", "/system/roles", ["roles.assign"]),
      planned("Settings", "/settings", ["campus.manage", "school.manage"]),
    ],
  },
];

/** Ready destinations the user is allowed to see. */
export function visibleNavigation(
  groups: NavGroup[],
  permissions: ReadonlySet<string>,
): NavGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          item.ready &&
          (!item.access || item.access.some((key) => permissions.has(key))),
      ),
    }))
    .filter((group) => group.items.length > 0);
}

/** Phone bottom bar: every item if there are at most `max`, otherwise the first max-1 plus a Menu tab. */
export function bottomTabs(groups: NavGroup[], max = 4) {
  const items = groups.flatMap((group) => group.items);

  if (items.length <= max) return { tabs: items, overflow: false };
  return { tabs: items.slice(0, max - 1), overflow: true };
}

export function campusPath(campusId: string, href: string) {
  return `/campuses/${encodeURIComponent(campusId)}${href}`;
}

export function isActivePath(pathname: string, campusId: string, href: string) {
  const base = campusPath(campusId, href);
  if (href === "") return pathname === base || pathname === `${base}/`;
  return pathname === base || pathname.startsWith(`${base}/`);
}

/** Finds the nav entry that best matches the current path (used for breadcrumbs). */
export function resolvePageContext(
  groups: NavGroup[],
  campusId: string,
  pathname: string,
): { group?: string; item: NavItem } | null {
  let best: { group?: string; item: NavItem } | null = null;

  for (const group of groups) {
    for (const item of group.items) {
      if (!isActivePath(pathname, campusId, item.href)) continue;
      if (!best || item.href.length > best.item.href.length) {
        best = { group: group.heading, item };
      }
    }
  }

  return best;
}