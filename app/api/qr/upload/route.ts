import { NextResponse } from "next/server";
import { StorageConfigError, uploadQrPng } from "@/lib/gcp-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB is far more than any QR PNG needs
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function error(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function POST(request: Request) {
  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return error("Expected multipart/form-data with a 'file' field.", 400);
  }

  if (!(file instanceof Blob)) return error("No image file was provided.", 400);
  if (file.size === 0) return error("The uploaded file is empty.", 400);
  if (file.size > MAX_BYTES) return error("The image is too large (max 2 MB).", 413);

  const png = Buffer.from(await file.arrayBuffer());
  if (!png.subarray(0, 8).equals(PNG_SIGNATURE)) {
    return error("Only PNG images can be uploaded.", 415);
  }

  try {
    const result = await uploadQrPng(png);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    // Log details server-side only; never echo credentials or raw SDK errors.
    if (err instanceof StorageConfigError) {
      console.error("[qr/upload] configuration error:", err.message);
      return error("Cloud storage is not configured on the server.", 500);
    }
    const code = (err as { code?: number }).code;
    const message = (err as Error).message ?? "";
    console.error("[qr/upload] upload failed:", code, message);
    if (message.includes("invalid_grant")) {
      return error("Google Cloud rejected the service account credentials.", 502);
    }
    if (code === 403 || code === 401) {
      return error("The server is not authorized to write to the storage bucket.", 502);
    }
    if (code === 404) return error("The configured storage bucket was not found.", 502);
    return error("Upload to Google Cloud Storage failed. Please try again.", 502);
  }
}
