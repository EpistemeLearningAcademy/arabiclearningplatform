import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { publishedStories } from "../../../../lib/public-site-content";
import { formatDate } from "../../../../lib/format";

type ArticleProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return publishedStories.map((story) => ({ slug: story.slug }));
}

export async function generateMetadata({ params }: ArticleProps): Promise<Metadata> {
  const { slug } = await params;
  const story = publishedStories.find((item) => item.slug === slug);
  if (!story) {
    return {
      title: "Page not found",
      description: "This Greenfield Schools story is not available.",
    };
  }

  return {
    title: story.title,
    description: story.summary,
    alternates: process.env.NEXT_PUBLIC_SITE_URL
      ? { canonical: new URL(`/school/news/${slug}`, process.env.NEXT_PUBLIC_SITE_URL).toString() }
      : undefined,
    openGraph: {
      title: `${story.title} | Greenfield Schools`,
      description: story.summary,
      type: "article",
      publishedTime: story.publishedAt,
    },
  };
}

export default async function PublicNewsArticle({ params }: ArticleProps) {
  const { slug } = await params;
  const story = publishedStories.find((item) => item.slug === slug);
  if (!story) notFound();

  return (
    <main className="bg-white text-ink">
      <article className="mx-auto max-w-[900px] px-5 py-12 sm:px-8 sm:py-16 lg:py-24">
        <Link href="/school/news" className="text-sm font-semibold text-brand hover:underline">
          ← All news
        </Link>
        <div className="mt-8 flex flex-wrap items-center gap-3 text-xs text-muted">
          <span className="font-semibold text-gold-deep">{story.category}</span>
          <time dateTime={story.publishedAt}>{formatDate(story.publishedAt)}</time>
        </div>
        <h1 className="font-display mt-4 text-4xl font-medium leading-tight text-ink sm:text-5xl">
          {story.title}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">{story.summary}</p>
        {story.image && (
          <figure className="mt-10">
            <img
              src={story.image.src}
              alt={story.image.alt}
              className="max-h-[38rem] w-full object-cover"
            />
          </figure>
        )}
        <div className="mt-10 max-w-2xl border-t border-line pt-8">
          {story.content.map((block, index) =>
            block.type === "heading" ? (
              <h2 key={`${block.type}-${index}`} className="font-display mt-8 text-2xl font-medium text-ink">
                {block.text}
              </h2>
            ) : (
              <p key={`${block.type}-${index}`} className="mt-5 text-base leading-8 text-ink-soft">
                {block.text}
              </p>
            ),
          )}
        </div>
      </article>
    </main>
  );
}
