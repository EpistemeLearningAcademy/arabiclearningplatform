import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
    : undefined,
  title: {
    default: "Greenfield Schools | Learning Platform",
    template: "%s | Greenfield Schools",
  },
  description: "The Greenfield Schools learning platform.",
  robots: { index: false, follow: false },
  applicationName: "Greenfield School Platform",
  appleWebApp: {
    capable: true,
    title: "Greenfield",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [{ url: "/pwa/icon/192", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/pwa/icon/180", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b3d2e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}