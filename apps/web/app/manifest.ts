import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Greenfield School Platform",
    short_name: "Greenfield",
    description: "The Greenfield Schools learning platform.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f5f4ef",
    theme_color: "#0b3d2e",
    categories: ["education"],
    icons: [
      { src: "/pwa/icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa/icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/pwa/icon/512?maskable=1",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}