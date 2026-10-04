import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  let sitemap: string | undefined;

  if (configuredSiteUrl) {
    try {
      sitemap = new URL("/sitemap.xml", configuredSiteUrl).toString();
    } catch {
      sitemap = undefined;
    }
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/school",
      disallow: ["/api/", "/campuses/"],
    },
    ...(sitemap ? { sitemap } : {}),
  };
}
