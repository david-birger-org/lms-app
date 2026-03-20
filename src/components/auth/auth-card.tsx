import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AuthCard({
  children,
  description,
  footerHref,
  footerLabel,
  footerText,
  title,
}: {
  children: React.ReactNode;
  description: string;
  footerHref: string;
  footerLabel: string;
  footerText: string;
  title: string;
}) {
  return (
    <Card className="w-full max-w-md border-border/70 shadow-lg">
      <CardHeader className="space-y-2 border-b">
        <div className="inline-flex w-fit rounded-full border bg-muted/30 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          David Birger admin
        </div>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">{children}</CardContent>
      <CardFooter className="border-t text-sm text-muted-foreground">
        {footerText}{" "}
        <Link
          className="font-medium text-foreground underline-offset-4 hover:underline"
          href={footerHref}
        >
          {footerLabel}
        </Link>
      </CardFooter>
    </Card>
  );
}
