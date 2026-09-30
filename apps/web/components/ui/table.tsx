import type { ReactNode } from "react";

export function TableShell({
  caption,
  children,
}: {
  caption: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-md border border-line bg-white">
      <table className="min-w-[36rem]">
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  );
}