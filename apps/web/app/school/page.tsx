import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { formatDate } from "../../lib/format";
import {
  learningCommunities,
  publishedEvents,
  publishedStories,
} from "../../lib/public-site-content";

const temporaryHeroImage = "/images/greenfield-home-hero-temporary-stock.jpg";

export const metadata: Metadata = {
  title: "Arise and Ascend",
  description:
    "Greenfield Schools brings Preschool, Primary and Secondary learning together in one school community.",
  alternates: process.env.NEXT_PUBLIC_SITE_URL
    ? { canonical: new URL("/school", process.env.NEXT_PUBLIC_SITE_URL).toString() }
    : undefined,
  openGraph: {
    title: "Arise and Ascend | Greenfield Schools",
    description:
      "An education shaped by learning, character and the confidence to take on what comes next.",
    type: "website",
    images: process.env.NEXT_PUBLIC_SITE_URL
      ? [new URL(temporaryHeroImage, process.env.NEXT_PUBLIC_SITE_URL).toString()]
      : undefined,
  },
};

export default function SchoolHomePage() {
  return (
    <main className="bg-white text-ink">
      <section className="relative isolate flex min-h-[min(82svh,48rem)] items-center overflow-hidden bg-brand text-white">
        <figure className="absolute inset-0 z-0">
          <Image
            src={temporaryHeroImage}
            alt="Illustrative stock photograph of students in a classroom; this is not a Greenfield campus photo."
            fill
            priority
            sizes="100vw"
            quality={82}
            className="object-cover object-center"
          />
        </figure>
        <div aria-hidden="true" className="absolute inset-0 z-10 bg-brand/20" />

        <div className="relative z-20 mx-auto w-full max-w-[1600px] px-5 py-20 sm:px-8 lg:px-12">
          <p className="text-xs font-semibold uppercase text-[#ead7a3]">
            Greenfield Schools
          </p>
          <h1 className="font-display mt-5 max-w-5xl text-5xl font-medium leading-[1.02] sm:text-6xl lg:text-8xl">
            Arise and Ascend
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-white/90 sm:text-lg sm:leading-8">
            An education shaped by learning, character and the confidence to take on what comes next.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/school/about"
              className="inline-flex min-h-12 items-center rounded-sm bg-white px-5 text-sm font-semibold text-brand transition-colors hover:bg-[#ead7a3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Explore Greenfield
            </Link>
            <Link
              href="/school/admissions"
              className="inline-flex min-h-12 items-center rounded-sm border border-white/75 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Admissions
            </Link>
          </div>
        </div>
        <p className="absolute bottom-4 right-4 z-20 max-w-[calc(100%-2rem)] bg-brand px-3 py-2 text-[11px] text-white sm:bottom-6 sm:right-8">
          Illustrative stock image · Replace with approved Greenfield photography
        </p>
      </section>

      <section className="scroll-mt-20" aria-labelledby="introduction-heading">
        <div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.65fr_1.35fr] lg:gap-20 lg:px-12 lg:py-28">
          <p className="text-xs font-semibold uppercase text-gold-deep">A school for learning and growth</p>
          <div className="max-w-4xl">
            <h2 id="introduction-heading" className="font-display text-3xl font-medium leading-tight text-ink sm:text-4xl lg:text-5xl">
              One school community, with room for every stage of learning.
            </h2>
            <p className="mt-6 max-w-3xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
              Greenfield Schools brings Preschool, Primary and Secondary learning together. We aim to help learners build knowledge, express ideas, develop character and find confidence in their own growth.
            </p>
            <Link href="/school/about" className="mt-7 inline-flex min-h-11 items-center text-sm font-semibold text-brand underline decoration-gold underline-offset-4 hover:text-brand-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-deep">
              About Greenfield <span aria-hidden="true" className="ml-3">→</span>
            </Link>
          </div>
        </div>
      </section>

      <section id="learning-communities" className="scroll-mt-20 border-y border-line bg-canvas">
        <div className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
          <div className="grid gap-5 md:grid-cols-[0.65fr_1.35fr] md:gap-12">
            <p className="text-xs font-semibold uppercase text-gold-deep">Learning communities</p>
            <div className="max-w-3xl">
              <h2 className="font-display text-3xl font-medium leading-tight text-ink sm:text-4xl">
                Different beginnings. A shared direction.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-muted sm:text-base sm:leading-7">
                Each stage responds to learners as they grow, with opportunities to explore, practise and take on new responsibility.
              </p>
            </div>
          </div>

          <ul className="mt-10 border-y border-line">
            {learningCommunities.map((community, index) => (
              <li key={community.href} className="border-b border-line last:border-b-0">
                <Link href={community.href} className="group grid min-h-28 gap-3 py-5 transition-colors hover:bg-white sm:grid-cols-[4rem_0.7fr_1fr_auto] sm:items-center sm:gap-6 sm:px-4">
                  <span className="font-display text-xl text-gold-deep">0{index + 1}</span>
                  <span className="font-display text-2xl font-medium text-ink transition-colors group-hover:text-brand sm:text-3xl">
                    {community.label}
                  </span>
                  <span className="max-w-xl text-sm leading-6 text-muted">{community.note}</span>
                  <span className="text-sm font-semibold text-brand">
                    Explore <span aria-hidden="true" className="ml-2">→</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="academic-experience-heading">
        <div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-16 sm:px-8 sm:py-20 md:grid-cols-[0.8fr_1.2fr] md:gap-14 lg:px-12 lg:py-28">
          <div>
            <p className="text-xs font-semibold uppercase text-gold-deep">The academic experience</p>
            <h2 id="academic-experience-heading" className="font-display mt-4 text-3xl font-medium leading-tight text-ink sm:text-4xl">
              Learning that reaches beyond the answer.
            </h2>
          </div>
          <div className="max-w-3xl">
            <p className="text-base leading-7 text-muted sm:text-lg sm:leading-8">
              Academic growth is built through subject learning, practice and reflection. Curiosity, creativity, communication and technology give learners more ways to make sense of ideas and share what they know.
            </p>
            <ul className="mt-8 grid border-y border-line sm:grid-cols-2 sm:divide-x sm:divide-line">
              {["Curriculum and subject learning", "Creative exploration", "Communication and critical thought", "Leadership and responsibility"].map((theme) => (
                  <li key={theme} className="flex min-h-14 items-center border-b border-line py-3 text-sm font-medium text-ink-soft sm:px-4">
                  <span aria-hidden="true" className="mr-3 size-1.5 rounded-full bg-gold" />
                  {theme}
                </li>
              ))}
            </ul>
            <Link href="/school/academics" className="mt-7 inline-flex min-h-11 items-center text-sm font-semibold text-brand underline decoration-gold underline-offset-4 hover:text-brand-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-deep">
              Explore academics <span aria-hidden="true" className="ml-3">→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-brand text-white" aria-labelledby="school-life-heading">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-16 sm:px-8 sm:py-20 md:grid-cols-[0.75fr_1.25fr] md:items-end md:gap-16 lg:px-12 lg:py-24">
          <div>
            <p className="text-xs font-semibold uppercase text-[#ead7a3]">School life</p>
            <h2 id="school-life-heading" className="font-display mt-4 text-3xl font-medium leading-tight sm:text-4xl">
              Learning is also made of people, ideas and shared moments.
            </h2>
          </div>
          <div className="max-w-2xl">
            <p className="text-sm leading-7 text-white/80 sm:text-base sm:leading-8">
              School life creates room for friendship, creative work, participation and leadership. This space will grow through approved stories and photographs from the Greenfield community.
            </p>
            <Link href="/school/life" className="mt-7 inline-flex min-h-11 items-center text-sm font-semibold text-white underline decoration-[#ead7a3] underline-offset-4 hover:text-[#ead7a3] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
              Explore school life <span aria-hidden="true" className="ml-3">→</span>
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="stories-heading">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-16 sm:px-8 sm:py-20 md:grid-cols-2 md:gap-14 lg:px-12 lg:py-24">
          <div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase text-gold-deep">From the community</p>
                <h2 id="stories-heading" className="font-display mt-3 text-2xl font-medium text-ink sm:text-3xl">News and stories</h2>
              </div>
              <Link href="/school/news" className="hidden text-sm font-semibold text-brand underline decoration-gold underline-offset-4 sm:inline">All news</Link>
            </div>
            <div className="mt-6 border-t border-line pt-5">
              {publishedStories.length > 0 ? (
                <ul className="divide-y divide-line">
                  {publishedStories.slice(0, 3).map((story) => (
                    <li key={story.slug}>
                      <Link href={`/school/news/${encodeURIComponent(story.slug)}`} className="block py-4 hover:text-brand">
                        <p className="text-xs text-muted">{story.category} · {formatDate(story.publishedAt)}</p>
                        <h3 className="mt-2 text-base font-semibold">{story.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-muted">{story.summary}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p role="status" className="text-sm leading-6 text-muted">No school stories have been published yet.</p>
              )}
            </div>
            <Link href="/school/news" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-brand underline decoration-gold underline-offset-4 sm:hidden">News and stories</Link>
          </div>

          <div>
            <div>
              <p className="text-xs font-semibold uppercase text-gold-deep">Dates for the community</p>
              <h2 className="font-display mt-3 text-2xl font-medium text-ink sm:text-3xl">Events</h2>
            </div>
            <div className="mt-6 border-t border-line pt-5">
              {publishedEvents.length > 0 ? (
                <ul className="divide-y divide-line">
                  {publishedEvents.slice(0, 3).map((event) => (
                    <li key={event.slug} className="py-4">
                      <p className="text-xs text-gold-deep">{formatDate(event.startsAt)}</p>
                      <h3 className="mt-2 text-base font-semibold text-ink">{event.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted">{event.summary}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p role="status" className="text-sm leading-6 text-muted">No upcoming events have been published yet.</p>
              )}
            </div>
            <Link href="/school/events" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-brand underline decoration-gold underline-offset-4">View events</Link>
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-canvas" aria-labelledby="admissions-cta-heading">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-7 px-5 py-16 sm:px-8 sm:py-20 md:flex-row md:items-end md:justify-between lg:px-12 lg:py-24">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase text-gold-deep">Admissions</p>
            <h2 id="admissions-cta-heading" className="font-display mt-4 text-3xl font-medium leading-tight text-ink sm:text-4xl">
              Begin with a conversation about your child’s next step.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted sm:text-base sm:leading-7">
              Explore the admissions journey and the questions families may want to ask.
            </p>
          </div>
          <Link href="/school/admissions" className="inline-flex min-h-12 w-fit shrink-0 items-center rounded-sm bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-deep">
            Admissions <span aria-hidden="true" className="ml-3">→</span>
          </Link>
        </div>
      </section>

    </main>
  );
}
