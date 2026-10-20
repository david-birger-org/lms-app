import { BookOpen, FileText, Video } from "lucide-react";
import Image from "next/image";

import { Link } from "@/i18n/routing";
import type { LectureSummary } from "@/lib/server/user-lectures";

export function LectureCard({ lecture }: { lecture: LectureSummary }) {
  return (
    <Link
      href={`/dashboard/lectures/${lecture.slug}`}
      className="group flex items-start gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
    >
      {lecture.coverImageUrl ? (
        <Image
          src={lecture.coverImageUrl}
          alt=""
          width={48}
          height={48}
          className="size-12 rounded-md object-cover"
        />
      ) : (
        <div className="flex size-12 items-center justify-center rounded-md border bg-muted/30">
          <BookOpen className="size-5 text-muted-foreground" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="font-medium group-hover:underline">{lecture.title}</p>
        {lecture.description && (
          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
            {lecture.description}
          </p>
        )}
      </div>
      {(lecture.hasVideo || lecture.hasNotes) && (
        <div className="flex shrink-0 gap-1.5 text-muted-foreground">
          {lecture.hasVideo && <Video className="size-4" />}
          {lecture.hasNotes && <FileText className="size-4" />}
        </div>
      )}
    </Link>
  );
}
