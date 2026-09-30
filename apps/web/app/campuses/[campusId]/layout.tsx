import Link from "next/link";
import type { ReactNode } from "react";
import { buttonClasses } from "../../../components/ui/button";
import { CampusShell } from "../../../components/shell/campus-shell";
import { formatRole, initials } from "../../../lib/format";
import { campusNavigation, visibleNavigation } from "../../../lib/navigation";
import { getCampusContext } from "../../../lib/server/campus-context";

export default async function CampusLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ campusId: string }>;
}) {
  const { campusId } = await params;
  const context = await getCampusContext(campusId);

  if (context.status === "unavailable") {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-canvas px-5">
        <section className="w-full max-w-lg rounded-md border border-line bg-white p-6 sm:p-8">
          <div className="flex size-10 items-center justify-center rounded-sm bg-brand text-sm font-semibold text-white">
            G
          </div>
          <h1 className="font-display mt-6 text-2xl text-ink">
            Greenfield is temporarily unavailable
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Please check that the school service is running, then try again.
          </p>
          <Link href="/" className={`mt-6 ${buttonClasses("primary")}`}>
            Return to campus selection
          </Link>
        </section>
      </main>
    );
  }

  return (
    <CampusShell
      campusId={campusId}
      campusName={context.campus.name}
      schoolName={context.campus.school.name}
      user={{
        name: context.user.name?.trim() || context.user.email,
        email: context.user.email,
        initials: initials(context.user.name, context.user.email),
        roleLabel: formatRole(context.role),
      }}
      navigation={visibleNavigation(campusNavigation, context.permissions)}
    >
      {children}
    </CampusShell>
  );
}