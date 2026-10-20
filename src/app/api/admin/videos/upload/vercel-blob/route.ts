import { type HandleUploadBody, handleUpload } from "@vercel/blob/client";
import { NextResponse } from "next/server";

import { requireAdminApiAccess } from "@/lib/auth/admin-server";

// Issues client-upload tokens for Vercel Blob. Admin only. Needs
// BLOB_READ_WRITE_TOKEN. The client attaches the video itself after upload,
// so there is no onUploadCompleted callback.
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as HandleUploadBody;
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const access = await requireAdminApiAccess(request);
        if (!access.ok) throw new Error("Not authorized.");
        if (!pathname.startsWith("lectures/"))
          throw new Error("Invalid upload path.");
        return {
          allowedContentTypes: ["video/*"],
          addRandomSuffix: true,
          maximumSizeInBytes: 5 * 1024 ** 3,
        };
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
