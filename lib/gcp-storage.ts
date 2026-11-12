import "server-only";
import { randomUUID } from "node:crypto";
import { Storage } from "@google-cloud/storage";

/** How long signed download URLs stay valid. */
const SIGNED_URL_TTL_MS = 60 * 60 * 1000; // 1 hour

export class StorageConfigError extends Error {}

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
  project_id?: string;
}

/**
 * Parses GCP_SERVICE_ACCOUNT_JSON. Accepts either the raw key JSON or a
 * base64-encoded copy of it (handy when a secret manager mangles newlines).
 */
function parseServiceAccount(raw: string): ServiceAccountKey {
  const trimmed = raw.trim();
  const text = trimmed.startsWith("{")
    ? trimmed
    : Buffer.from(trimmed, "base64").toString("utf8");

  let parsed: ServiceAccountKey;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new StorageConfigError("GCP_SERVICE_ACCOUNT_JSON is not valid JSON.");
  }
  if (!parsed.client_email || !parsed.private_key) {
    throw new StorageConfigError(
      "GCP_SERVICE_ACCOUNT_JSON is missing client_email or private_key."
    );
  }
  // Secret stores sometimes keep "\n" as a literal two-character sequence.
  parsed.private_key = parsed.private_key.replace(/\n/g, "\n");
  return parsed;
}

// The client is cached, but keyed on the raw credential string so that a
// rotated secret is picked up without relying on stale state.
let cached: { key: string; storage: Storage } | null = null;

function getStorage(): Storage {
  const projectId = process.env.GCP_PROJECT_ID;
  const rawKey = process.env.GCP_SERVICE_ACCOUNT_JSON;
  if (!projectId) throw new StorageConfigError("GCP_PROJECT_ID is not set.");
  if (!rawKey) throw new StorageConfigError("GCP_SERVICE_ACCOUNT_JSON is not set.");

  const cacheKey = `${projectId}:${rawKey}`;
  if (cached?.key === cacheKey) return cached.storage;

  const sa = parseServiceAccount(rawKey);
  const storage = new Storage({
    projectId,
    credentials: { client_email: sa.client_email, private_key: sa.private_key },
  });
  cached = { key: cacheKey, storage };
  return storage;
}

function getBucketName(): string {
  const bucket = process.env.GCP_BUCKET_NAME;
  if (!bucket) throw new StorageConfigError("GCP_BUCKET_NAME is not set.");
  return bucket;
}

export interface UploadResult {
  fileName: string;
  bucket: string;
  signedUrl: string;
  expiresAt: string;
}

/** Uploads a PNG to the private bucket and returns a short-lived signed URL. */
export async function uploadQrPng(png: Buffer): Promise<UploadResult> {
  const storage = getStorage();
  const bucketName = getBucketName();

  const now = new Date();
  const datePath = now.toISOString().slice(0, 10).replace(/-/g, "/");
  const fileName = `qr-codes/${datePath}/qr-${now.getTime()}-${randomUUID().slice(0, 8)}.png`;

  const file = storage.bucket(bucketName).file(fileName);
  await file.save(png, {
    resumable: false,
    contentType: "image/png",
    metadata: { cacheControl: "private, max-age=3600" },
  });

  const expires = Date.now() + SIGNED_URL_TTL_MS;
  const [signedUrl] = await file.getSignedUrl({
    version: "v4",
    action: "read",
    expires,
  });

  return {
    fileName,
    bucket: bucketName,
    signedUrl,
    expiresAt: new Date(expires).toISOString(),
  };
}
