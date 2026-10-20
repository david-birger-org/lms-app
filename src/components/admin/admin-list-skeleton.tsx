import { Section } from "@/components/shell/page";
import { Skeleton } from "@/components/ui/skeleton";

const ROWS = ["a", "b", "c", "d", "e", "f"];

/** Loading state for an admin manager: a toolbar row over a DataList. */
export function AdminListSkeleton({ toolbar = true }: { toolbar?: boolean }) {
  return (
    <Section>
      {toolbar ? (
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-9 w-full max-w-xs" />
          <Skeleton className="h-9 w-28 shrink-0" />
        </div>
      ) : null}
      <div className="overflow-hidden rounded-xl border bg-card shadow-card">
        <div className="hidden h-10 border-b bg-background-200 md:block" />
        <div className="divide-y">
          {ROWS.map((key) => (
            <div
              key={key}
              className="flex flex-col gap-2 p-4 md:h-14 md:flex-row md:items-center md:gap-6 md:px-4 md:py-0"
            >
              <Skeleton className="h-4 w-2/5 md:w-1/4" />
              <Skeleton className="h-4 w-3/5 md:w-1/3" />
              <Skeleton className="hidden h-6 w-16 rounded-full md:ml-auto md:block" />
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
