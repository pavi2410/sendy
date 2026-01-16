import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || "auto",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

const BUCKET_NAME = process.env.S3_BUCKET!;

export interface UploadUrlOptions {
  key: string;
  contentType: string;
  contentLength: number;
  expiresIn?: number;
}

export interface DownloadUrlOptions {
  key: string;
  filename: string;
  expiresIn?: number;
}

/**
 * Generate a presigned URL for uploading a file directly to S3
 */
export async function getUploadUrl({
  key,
  contentType,
  contentLength,
  expiresIn = 3600,
}: UploadUrlOptions): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    ContentLength: contentLength,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Generate a presigned URL for downloading a file from S3
 */
export async function getDownloadUrl({
  key,
  filename,
  expiresIn = 3600,
}: DownloadUrlOptions): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${filename}"`,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Delete a file from S3
 */
export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Check if a file exists in S3
 */
export async function fileExists(key: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    await s3Client.send(command);
    return true;
  } catch {
    return false;
  }
}

export { s3Client, BUCKET_NAME };
