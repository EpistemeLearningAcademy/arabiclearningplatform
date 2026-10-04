import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorialPage } from "../../../components/public-site/editorial-page";
import { publicPages } from "../../../lib/public-site-content";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return Object.keys(publicPages).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = publicPages[slug];
  if (!page) return {};

  return {
    title: page.title,
    description: page.description,
    alternates: process.env.NEXT_PUBLIC_SITE_URL
      ? { canonical: new URL(`/school/${slug}`, process.env.NEXT_PUBLIC_SITE_URL).toString() }
      : undefined,
    openGraph: {
      title: `${page.title} | Greenfield Schools`,
      description: page.description,
      type: "website",
    },
  };
}

export default async function PublicSectionPage({ params }: PageProps) {
  const { slug } = await params;
  const page = publicPages[slug];
  if (!page) notFound();

  return <EditorialPage page={page} />;
}
