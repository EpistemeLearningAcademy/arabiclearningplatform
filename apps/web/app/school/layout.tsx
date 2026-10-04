import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SchoolFooter } from "../../components/public-site/school-footer";
import { SchoolHeader } from "../../components/public-site/school-header";

export const metadata: Metadata = {
  title: {
    default: "Greenfield Schools | Arise and Ascend",
    template: "%s | Greenfield Schools",
  },
  description:
    "Greenfield Schools brings Preschool, Primary and Secondary learning together in one school community.",
  applicationName: "Greenfield Schools",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Greenfield Schools",
    title: "Greenfield Schools | Arise and Ascend",
    description:
      "Learning, character and opportunity across Greenfield Schools.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Greenfield Schools | Arise and Ascend",
    description:
      "Learning, character and opportunity across Greenfield Schools.",
  },
};

export default function SchoolLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SchoolHeader />
      {children}
      <SchoolFooter />
    </>
  );
}
