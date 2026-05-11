import type { SupabaseClient } from "@supabase/supabase-js";

export async function uploadDocument(
  supabase: SupabaseClient,
  file: File,
  folder: string
) {
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "-").toLowerCase();
  const generatedName = `${crypto.randomUUID()}-${cleanName}`;
  const path = `${folder}/${generatedName}`;

  // Upload via server route so we don't depend on Storage RLS policies during dev.
  const formData = new FormData();
  formData.set("folder", folder);
  formData.set("fileName", file.name);
  formData.set("file", file);

  const response = await fetch("/api/documents/upload", {
    method: "POST",
    body: formData,
    credentials: "include"
  });

  const result = (await response.json().catch(() => ({}))) as
    | { publicUrl?: string; error?: string; message?: string }
    | undefined;

  if (!response.ok) {
    const message = result?.error ?? result?.message ?? "Unable to upload document.";
    throw new Error(message);
  }

  if (!result?.publicUrl) {
    throw new Error("Unable to upload document.");
  }

  // Keep return value consistent with previous implementation.
  return result.publicUrl;
}
