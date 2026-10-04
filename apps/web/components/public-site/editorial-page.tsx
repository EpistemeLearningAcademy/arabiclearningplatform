import Link from "next/link";
import { buttonClasses } from "../ui/button";
import { Badge } from "../ui/badge";
import { EmptyState } from "../ui/states";
import { formatDate } from "../../lib/format";
import {
  learningCommunities,
  publishedEvents,
  publishedStories,
  publicNavigation,
  type PublicPageData,
} from "../../lib/public-site-content";

function PageHeading({ page }: { page: PublicPageData }) {
  return (
    <section className="border-b border-line bg-canvas">
      <div className="mx-auto max-w-[1280px] px-5 py-14 sm:px-8 sm:py-18 lg:px-12 lg:py-24">
        <nav aria-label="Breadcrumb" className="text-xs text-muted">
          <ol className="flex items-center gap-2">
            <li><Link href="/school" className="hover:text-brand">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="font-medium text-ink-soft">{page.title}</li>
          </ol>
        </nav>
        <p className="mt-8 text-xs font-semibold uppercase text-gold-deep">
          Greenfield Schools
        </p>
        <h1 className="font-display mt-3 max-w-4xl text-4xl font-medium leading-tight text-ink sm:text-5xl lg:text-6xl">
          {page.title}
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
          {page.intro}
        </p>
      </div>
    </section>
  );
}

function EditorialSections({ page }: { page: PublicPageData }) {
  return (
    <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
      {page.sections.map((section, index) => (
        <section
          key={section.title}
          className="grid gap-5 border-b border-line py-10 sm:py-14 md:grid-cols-[minmax(10rem,0.38fr)_minmax(0,1fr)] md:gap-12 lg:gap-20"
        >
          <div>
            {section.eyebrow && (
              <p className="text-xs font-semibold uppercase text-gold-deep">
                {section.eyebrow}
              </p>
            )}
            <p className="mt-2 text-xs text-muted">0{index + 1}</p>
          </div>
          <div className="max-w-3xl">
            <h2 className="font-display text-2xl font-medium leading-tight text-ink sm:text-3xl">
              {section.title}
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted sm:text-base">
              {section.body}
            </p>
            {section.points && (
              <ul className="mt-6 grid gap-x-8 sm:grid-cols-2">
                {section.points.map((point) => (
                  <li
                    key={point}
                    className="flex min-h-11 items-center border-t border-line py-2 text-sm font-medium text-ink-soft"
                  >
                    <span className="mr-3 size-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                    {point}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

function LearningLinks() {
  return (
    <section className="border-y border-line bg-canvas">
      <div className="mx-auto max-w-[1280px] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        <p className="text-xs font-semibold uppercase text-gold-deep">Learning communities</p>
        <h2 className="font-display mt-3 text-2xl font-medium text-ink sm:text-3xl">
          Continue exploring
        </h2>
        <ul className="mt-7 grid border-y border-line md:grid-cols-3 md:divide-x md:divide-line">
          {learningCommunities.map((community, index) => (
            <li key={community.href}>
              <Link
                href={community.href}
                className="group flex min-h-36 flex-col justify-between gap-4 border-b border-line py-5 focus-visible:outline-2 focus-visible:outline-brand md:min-h-40 md:border-b-0 md:px-5 md:py-6 first:md:pl-0 last:md:pr-0"
              >
                <span>
                  <span className="block text-xs font-semibold text-gold-deep">0{index + 1}</span>
                  <span className="mt-2 block text-lg font-semibold text-ink transition-colors group-hover:text-brand">
                    {community.label}
                  </span>
                  <span className="mt-1 block max-w-xs text-sm leading-6 text-muted">
                    {community.note}
                  </span>
                </span>
                <span className="text-sm font-semibold text-brand">
                  Explore <span aria-hidden="true">→</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function AdmissionsJourney() {
  const stages = [
    "Enquiry",
    "Application",
    "Application review",
    "Assessment or conversation",
    "Decision",
  ];

  return (
    <section className="border-y border-line bg-canvas">
      <div className="mx-auto max-w-[1280px] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        <div className="grid gap-6 md:grid-cols-[0.65fr_1.35fr] md:gap-12">
          <div>
            <p className="text-xs font-semibold uppercase text-gold-deep">The admissions journey</p>
            <h2 className="font-display mt-3 text-2xl font-medium leading-tight text-ink sm:text-3xl">
              A considered process for each learner.
            </h2>
            <p className="mt-4 text-sm leading-6 text-muted">
              The admissions team will explain which steps apply to your child and the learning community.
            </p>
          </div>
          <ol className="divide-y divide-line border-y border-line">
            {stages.map((stage, index) => (
              <li key={stage} className="flex min-h-14 items-center gap-4 py-3">
                <span className="font-display text-lg text-gold-deep">0{index + 1}</span>
                <span className="text-sm font-semibold text-ink">{stage}</span>
              </li>
            ))}
          </ol>
        </div>
        <Link href="/school/contact" className={`${buttonClasses("primary")} mt-8`}>
          Contact the school
        </Link>
      </div>
    </section>
  );
}

function StoryListing() {
  if (publishedStories.length === 0) {
    return (
      <section className="mx-auto max-w-[1280px] px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
        <EmptyState
          title="No stories have been published yet"
          description="Approved Greenfield news and school stories will appear here when they are available."
        />
      </section>
    );
  }

  return (
    <section aria-label="Published stories" className="mx-auto max-w-[1280px] px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
      <ul className="divide-y divide-line border-y border-line">
        {publishedStories.map((story) => (
          <li key={story.slug}>
            <Link href={`/school/news/${encodeURIComponent(story.slug)}`} className="grid gap-3 py-6 sm:grid-cols-[10rem_1fr] sm:gap-8">
              <div className="flex items-start gap-3 text-xs text-muted">
                <Badge>{story.category}</Badge>
                <time dateTime={story.publishedAt}>{formatDate(story.publishedAt)}</time>
              </div>
              <span>
                <span className="block text-lg font-semibold text-ink">{story.title}</span>
                <span className="mt-2 block max-w-2xl text-sm leading-6 text-muted">{story.summary}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function EventListing() {
  if (publishedEvents.length === 0) {
    return (
      <section className="mx-auto max-w-[1280px] px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
        <EmptyState
          title="No upcoming events have been published"
          description="The events list will show dates and details when verified school information is available."
        />
      </section>
    );
  }

  return (
    <section aria-label="Published events" className="mx-auto max-w-[1280px] px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
      <ul className="divide-y divide-line border-y border-line">
        {publishedEvents.map((event) => (
            <li key={event.slug} className="grid gap-3 py-6 sm:grid-cols-[10rem_1fr] sm:gap-8">
            <time dateTime={event.startsAt} className="text-sm font-semibold text-gold-deep">
              {formatDate(event.startsAt)}
            </time>
            <div>
              <Link href={`/school/events/${encodeURIComponent(event.slug)}`} className="text-lg font-semibold text-ink hover:text-brand">
                {event.title}
              </Link>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{event.summary}</p>
              {event.location && <p className="mt-2 text-xs text-muted">{event.location}</p>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function EditorialPage({ page }: { page: PublicPageData }) {
  return (
    <main className="bg-white text-ink">
      <PageHeading page={page} />

      {page.kind === "news" ? (
        <StoryListing />
      ) : page.kind === "events" ? (
        <EventListing />
      ) : page.kind === "stories" ? (
        <>
          <EditorialSections page={page} />
          <section className="mx-auto max-w-[1280px] px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
            <EmptyState
              title="School stories are being prepared"
              description="Student experiences and community stories will appear here when approved editorial content is ready."
            />
          </section>
        </>
      ) : (
        <EditorialSections page={page} />
      )}

      {page.kind === "admissions" && <AdmissionsJourney />}
      {page.kind === "program" && <LearningLinks />}

      {page.kind === "contact" && (
        <section className="mx-auto max-w-[1280px] px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
          <EmptyState
            title="Verified contact details are not published yet"
            description="This page is ready for approved school contact information. No contact channels have been supplied to the platform."
          />
        </section>
      )}
    </main>
  );
}
