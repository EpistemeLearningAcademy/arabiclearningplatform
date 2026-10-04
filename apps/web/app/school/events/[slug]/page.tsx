import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate } from "../../../../lib/format";
import { publishedEvents } from "../../../../lib/public-site-content";

type EventProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return publishedEvents.map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({ params }: EventProps): Promise<Metadata> {
  const { slug } = await params;
  const event = publishedEvents.find((item) => item.slug === slug);
  if (!event) {
    return {
      title: "Page not found",
      description: "This Greenfield Schools event is not available.",
    };
  }

  return {
    title: event.title,
    description: event.summary,
    alternates: process.env.NEXT_PUBLIC_SITE_URL
      ? { canonical: new URL(`/school/events/${slug}`, process.env.NEXT_PUBLIC_SITE_URL).toString() }
      : undefined,
    openGraph: {
      title: `${event.title} | Greenfield Schools`,
      description: event.summary,
      type: "website",
    },
  };
}

export default async function PublicEventPage({ params }: EventProps) {
  const { slug } = await params;
  const event = publishedEvents.find((item) => item.slug === slug);
  if (!event) notFound();

  return (
    <main className="bg-white text-ink">
      <article className="mx-auto max-w-[900px] px-5 py-12 sm:px-8 sm:py-16 lg:py-24">
        <Link href="/school/events" className="text-sm font-semibold text-brand hover:underline">
          ← All events
        </Link>
        <p className="mt-8 text-xs font-semibold uppercase text-gold-deep">Greenfield Schools event</p>
        <h1 className="font-display mt-4 text-4xl font-medium leading-tight text-ink sm:text-5xl">
          {event.title}
        </h1>
        <p className="mt-5 text-sm font-semibold text-ink-soft">
          <time dateTime={event.startsAt}>{formatDate(event.startsAt)}</time>
          {event.endsAt && <> – <time dateTime={event.endsAt}>{formatDate(event.endsAt)}</time></>}
        </p>
        {event.location && <p className="mt-2 text-sm text-muted">{event.location}</p>}
        <p className="mt-8 max-w-2xl text-lg leading-8 text-muted">{event.summary}</p>
        {event.details && (
          <div className="mt-8 max-w-2xl space-y-5 border-t border-line pt-7 text-base leading-8 text-ink-soft">
            {event.details.map((detail) => <p key={detail}>{detail}</p>)}
          </div>
        )}
      </article>
    </main>
  );
}
