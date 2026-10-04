import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  description: "This Greenfield Schools page could not be found.",
};

export default function SchoolNotFound() {
  return (
    <main className="bg-white text-ink">
      <section className="mx-auto flex min-h-[55svh] max-w-[1200px] flex-col justify-center px-5 py-16 sm:px-8 lg:px-12">
        <p className="text-xs font-semibold uppercase text-gold-deep">Greenfield Schools</p>
        <h1 className="font-display mt-4 text-4xl font-medium text-ink sm:text-5xl">
          This page could not be found.
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-muted">
          The page may have moved, or its content may not have been published yet.
        </p>
        <Link
          href="/school"
          className="mt-7 inline-flex min-h-11 w-fit items-center rounded-sm bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-deep"
        >
          Return to Greenfield home
        </Link>
      </section>
    </main>
  );
}