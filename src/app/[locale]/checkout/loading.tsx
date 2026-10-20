import { PublicPage } from "@/components/auth/public-page";
import { Skeleton } from "@/components/ui/skeleton";

/** Matches the checkout layout: header, order summary, then the action. */
export default function CheckoutLoading() {
  return (
    <PublicPage className="pb-40 sm:pb-24">
      <div aria-busy className="flex w-full max-w-md flex-col gap-6">
        <div className="flex flex-col gap-2.5">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <div className="rounded-xl border bg-background shadow-card">
          <div className="flex flex-col divide-y">
            {["product", "payer"].map((row) => (
              <div
                key={row}
                className="flex items-center justify-between gap-4 px-4 py-4 sm:px-5"
              >
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-36" />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between gap-4 rounded-b-xl border-t bg-background-200 px-4 py-4 sm:px-5">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-7 w-24" />
          </div>
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 border-t bg-background pb-safe sm:static sm:w-full sm:max-w-md sm:border-0 sm:bg-transparent sm:pb-0">
        <div className="mx-auto flex w-full max-w-md flex-col gap-3 px-4 py-3 sm:p-0">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="mx-auto h-3 w-56" />
        </div>
      </div>
    </PublicPage>
  );
}
