import type { MetadataRoute } from "next";
import {
  publicNavigation,
  publishedEvents,
  publishedStories,
} from "../lib/public-site-content";

export default function sitemap(): MetadataRoute.Sitemap {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!configuredSiteUrl) return [];

  let siteUrl: URL;
  try {
    siteUrl = new URL(configuredSiteUrl);
  } catch {
    return [];
  }

  const sectionUrls = publicNavigation
    .filter((item) => item.href.startsWith("/school"))
    .map((item) => ({ url: new URL(item.href, siteUrl).toString() }));

  const storyUrls = publishedStories.map((story) => ({
    url: new URL(`/school/news/${encodeURIComponent(story.slug)}`, siteUrl).toString(),
    lastModified: new Date(story.publishedAt),
  }));

  const eventUrls = publishedEvents.map((event) => ({
    url: new URL(`/school/events/${encodeURIComponent(event.slug)}`, siteUrl).toString(),
    lastModified: new Date(event.startsAt),
  }));

  return [...sectionUrls, ...storyUrls, ...eventUrls];
}
