export type Experience =
  | "leadership"
  | "teaching"
  | "learner"
  | "family"
  | "transport"
  | "finance"
  | "admissions"
  | "staff";

const signals: Record<Exclude<Experience, "staff">, readonly string[]> = {
  leadership: [
    "campus.manage",
    "school.manage",
    "academic.structure.manage",
    "roles.assign",
    "platform.provision",
    "platform.security.manage",
  ],
  teaching: [
    "lessons.assigned.manage",
    "assignments.assigned.manage",
    "assessments.assigned.manage",
    "attendance.assigned.manage",
    "results.assigned.read",
    "students.pastoral.assigned.manage",
  ],
  learner: ["students.self.read", "results.self.read", "assignments.self.submit"],
  family: [
    "students.linked.read",
    "finance.statement.linked.read",
    "finance.payment.linked.initiate",
  ],
  transport: ["transport.assigned.read"],
  finance: ["finance.read", "finance.manage", "finance.reports.read"],
  admissions: [
    "admissions.applicants.read",
    "admissions.applicants.manage",
  ],
};

const priority = [
  "leadership",
  "teaching",
  "learner",
  "family",
  "transport",
  "finance",
  "admissions",
] as const;

/** Matching experiences in priority order; "staff" when none match. */
export function resolveExperiences(
  permissions: ReadonlySet<string>,
): Experience[] {
  const matches = priority.filter((experience) =>
    signals[experience].some((key) => permissions.has(key)),
  );

  return matches.length > 0 ? matches : ["staff"];
}

export type WorkspaceArea = {
  title: string;
  description: string;
  /** Campus-relative path; only linked when the user can actually open it. */
  href?: string;
};

export const experienceCopy: Record<
  Experience,
  { description: string; areas: WorkspaceArea[] }
> = {
  leadership: {
    description: "Here is how your campus is set up.",
    areas: [
      {
        title: "Academic structure",
        description: "Academic years, terms, classes and subjects.",
        href: "/academic/years",
      },
      {
        title: "Students and staff",
        description: "People records, enrolment and role assignments.",
      },
      {
        title: "Oversight",
        description: "Reports and activity across the campus.",
      },
    ],
  },
  teaching: {
    description: "Your teaching workspace.",
    areas: [
      { title: "Today's teaching", description: "Your timetable and lessons for the day." },
      { title: "Your classes", description: "Classes and subjects assigned to you." },
      {
        title: "Assessment and marking",
        description: "Assignments, assessments and results you manage.",
      },
    ],
  },
  learner: {
    description: "Your learning workspace.",
    areas: [
      { title: "Your classes", description: "Subjects and lessons for your class." },
      { title: "Assignments", description: "Work to complete and hand in." },
      { title: "Results", description: "Your published assessment results." },
    ],
  },
  family: {
    description: "Keep up with your children's school life.",
    areas: [
      { title: "Your children", description: "Linked students, attendance and progress." },
      { title: "School updates", description: "Announcements and messages from the school." },
      { title: "Fees", description: "Statements and payments for linked students." },
    ],
  },
  transport: {
    description: "Your routes for the day.",
    areas: [
      { title: "Today's route", description: "Your assigned runs for the day." },
      { title: "Assigned students", description: "Basic details for students on your run." },
    ],
  },
  finance: {
    description: "Your finance workspace.",
    areas: [
      { title: "Fees and payments", description: "Fee schedules, invoices and payment records." },
      { title: "Finance reports", description: "Financial summaries for your authorized scope." },
    ],
  },
  admissions: {
    description: "Your admissions workspace.",
    areas: [
      { title: "Applicant journey", description: "Applications, review and admissions decisions." },
      { title: "Admissions activity", description: "Updates and work for your authorized scope." },
    ],
  },
  staff: {
    description: "Your Greenfield workspace.",
    areas: [
      { title: "Your tasks", description: "Work assigned to you by the school." },
      { title: "Announcements", description: "Updates from the school." },
    ],
  },
};