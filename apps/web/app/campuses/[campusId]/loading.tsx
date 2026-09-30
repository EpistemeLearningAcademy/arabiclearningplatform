import { Skeleton } from "../../../components/ui/states";

export default function CampusLoading() {
  return (
    <div role="status" aria-live="polite" className="space-y-8">
      <span className="sr-only">Loading</span>

      <div>
        <Skeleton className="h-3 w-40" />
        <Skeleton className="mt-4 h-9 w-72 max-w-full" />
        <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Skeleton className="h-56 rounded-md" />
        <Skeleton className="h-56 rounded-md" />
      </div>

      <Skeleton className="h-48 rounded-md" />
    </div>
  );
}