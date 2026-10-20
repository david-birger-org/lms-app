import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-md bg-foreground text-[11px] font-semibold tracking-tight text-background select-none",
        className,
      )}
    >
      DB
    </span>
  );
}

/** The slash Vercel uses between levels of context in the top bar. */
export function ContextSlash() {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: decorative separator, hidden from assistive tech.
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-5 shrink-0 text-gray-500"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
    >
      <path d="M16.88 3.549L7.12 20.451" />
    </svg>
  );
}
