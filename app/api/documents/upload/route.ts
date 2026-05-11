import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { getAuthedServiceClient, jsonError, validationError } from "@/lib/api-utils";

const uploadRequestSchema = z.object({
  folder: z.string().min(1),
  fileName: z.string().min(1)
});

type UploadResponse = {
  publicUrl: string;
  path: string;
};

function isFileLike(value: unknown): value is { arrayBuffer: () => Promise<ArrayBuffer>; name?: string; type?: string } {
  if (!value || typeof value !== "object") return false;
  const maybe = value as { arrayBuffer?: unknown };
  return typeof maybe.arrayBuffer === "function";
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const auth = await getAuthedServiceClient();
    if ("error" in auth) {
      return auth.error ?? jsonError("Authentication required.", 401);
    }

    const formData = await request.formData();

    const folderValue = formData.get("folder");
    const fileValue = formData.get("file");

    if (typeof folderValue !== "string") {
      return jsonError("Invalid folder.", 422);
    }

    if (!isFileLike(fileValue)) {
      return jsonError("Invalid file.", 422);
    }

    const rawFileName = typeof (fileValue as { name?: unknown }).name === "string" ? (fileValue as { name?: string }).name : "upload.bin";

    const parsed = uploadRequestSchema.parse({
      folder: folderValue,
      fileName: rawFileName
    });

    const cleanName = parsed.fileName.replace(/[^a-zA-Z0-9.-]/g, "-").toLowerCase();
    const generatedName = `${randomUUID()}-${cleanName}`;
    const path = `${parsed.folder}/${generatedName}`;

    const contentType = typeof (fileValue as { type?: unknown }).type === "string" ? (fileValue as { type: string }).type : "application/octet-stream";

    const bytes = new Uint8Array(Buffer.from(await fileValue.arrayBuffer()));

    // Service role upload bypasses RLS; this avoids Storage policy gaps during dev.
    const { error: uploadError } = await auth.service.storage.from("documents").upload(path, bytes, {
      contentType,
      upsert: false
    });

    if (uploadError) {
      return jsonError(uploadError.message, 400);
    }

    const { data: publicUrlData } = auth.service.storage.from("documents").getPublicUrl(path);

    if (!publicUrlData.publicUrl) {
      return jsonError("Unable to generate public URL.", 500);
    }

    return NextResponse.json({ publicUrl: publicUrlData.publicUrl, path }, { status: 201 });
  } catch (error) {
    return validationError(error);
  }
}

