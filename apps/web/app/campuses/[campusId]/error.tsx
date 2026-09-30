"use client";

import Link from "next/link";
import { buttonClasses } from "../../../components/ui/button";

export default function CampusError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section
      role="alert"
      className="mx-auto mt-6 w-full max-w-lg rounded-md border border-line bg-white p-6 sm:p-8"
    >
      <h1 className="font-display text-2xl text-ink">
        This page could not be loaded
      </h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        Something went wrong while loading this part of your workspace. You can
        try again, or go back to campus selection.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className={buttonClasses("primary")}
        >
          Try again
        </button>
        <Link href="/" className={buttonClasses("secondary")}>
          Campus selection
        </Link>
      </div>
    </section>
  );
}