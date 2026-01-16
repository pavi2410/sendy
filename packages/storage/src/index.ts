import { S3Client } from "bun";

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || "auto",
  accessKeyId: process.env.S3_ACCESS_KEY_ID!,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  bucket: process.env.S3_BUCKET!,
});

export interface UploadUrlOptions {
  key: string;
  contentType: string;
  expiresIn?: number;
}

export interface DownloadUrlOptions {
  key: string;
  expiresIn?: number;
}

/**
 * Generate a presigned URL for uploading a file directly to S3
 */
export function getUploadUrl({
  key,
  contentType,
  expiresIn = 3600,
}: UploadUrlOptions): string {
  return s3.presign(key, {
    method: "PUT",
    type: contentType,
    expiresIn,
  });
}

/**
 * Generate a presigned URL for downloading a file from S3
 */
export function getDownloadUrl({
  key,
  expiresIn = 3600,
}: DownloadUrlOptions): string {
  return s3.presign(key, {
    method: "GET",
    expiresIn,
  });
}

/**
 * Delete a file from S3
 */
export async function deleteFile(key: string): Promise<void> {
  await s3.delete(key);
}

/**
 * Check if a file exists in S3
 */
export async function fileExists(key: string): Promise<boolean> {
  return s3.exists(key);
}

export { s3 };
