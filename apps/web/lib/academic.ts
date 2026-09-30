export type AcademicTerm = {
  id: string;
  name: string;
  startsAt: string | null;
  endsAt: string | null;
  sequence: number;
};

export type AcademicYear = {
  id: string;
  name: string;
  startsAt: string | null;
  endsAt: string | null;
  terms: AcademicTerm[];
};

export type AcademicYearsResponse = {
  data: AcademicYear[];
};

export type UpcomingDate = {
  key: string;
  label: string;
  detail: string;
  date: Date;
};

export type AcademicSnapshot = {
  yearCount: number;
  currentYear: AcademicYear | null;
  currentTerm: AcademicTerm | null;
  nextTerm: (AcademicTerm & { yearName: string }) | null;
  termProgress: {
    totalDays: number;
    elapsedDays: number;
    remainingDays: number;
    percent: number;
  } | null;
  upcoming: UpcomingDate[];
};

const DAY_MS = 86_400_000;

function timestamp(value: string | null) {
  if (!value) return null;
  const result = new Date(value).getTime();
  return Number.isFinite(result) ? result : null;
}

function within(start: string | null, end: string | null, now: Date) {
  const startsAt = timestamp(start);
  const endsAt = timestamp(end);
  return (startsAt !== null || endsAt !== null) &&
    (startsAt === null || startsAt <= +now) &&
    (endsAt === null || +now <= endsAt);
}

export function buildAcademicSnapshot(
  years: AcademicYear[],
  now: Date,
): AcademicSnapshot {
  const currentYear =
    years.find((year) => within(year.startsAt, year.endsAt, now)) ?? null;

  const currentTerm = currentYear
    ? (currentYear.terms
        .slice()
        .sort((a, b) => a.sequence - b.sequence)
        .find((term) => within(term.startsAt, term.endsAt, now)) ?? null)
    : null;

  const allTerms = years.flatMap((year) =>
    year.terms.map((term) => ({ ...term, yearName: year.name })),
  );

  const nextTerm =
    allTerms
      .filter((term) => {
        const startsAt = timestamp(term.startsAt);
        return startsAt !== null && startsAt > +now;
      })
      .sort((a, b) => timestamp(a.startsAt)! - timestamp(b.startsAt)!)[0] ?? null;

  let termProgress: AcademicSnapshot["termProgress"] = null;

  if (currentTerm?.startsAt && currentTerm.endsAt) {
    const start = timestamp(currentTerm.startsAt);
    const end = timestamp(currentTerm.endsAt);
    if (start !== null && end !== null) {
      const totalDays = Math.max(1, Math.round((end - start) / DAY_MS));
      const elapsedDays = Math.min(
        totalDays,
        Math.max(0, Math.floor((+now - start) / DAY_MS)),
      );

      termProgress = {
        totalDays,
        elapsedDays,
        remainingDays: totalDays - elapsedDays,
        percent: Math.round((elapsedDays / totalDays) * 100),
      };
    }
  }

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const upcoming = years
    .flatMap((year) =>
      year.terms.flatMap((term) => {
        const startsAt = timestamp(term.startsAt);
        const endsAt = timestamp(term.endsAt);
        return [
          ...(startsAt !== null
            ? [{ key: `${term.id}-start`, label: `${term.name} begins`, detail: year.name, date: new Date(startsAt) }]
            : []),
          ...(endsAt !== null
            ? [{ key: `${term.id}-end`, label: `${term.name} ends`, detail: year.name, date: new Date(endsAt) }]
            : []),
        ];
      }),
    )
    .filter((event) => event.date >= startOfToday)
    .sort((a, b) => +a.date - +b.date)
    .slice(0, 5);

  return {
    yearCount: years.length,
    currentYear,
    currentTerm,
    nextTerm,
    termProgress,
    upcoming,
  };
}