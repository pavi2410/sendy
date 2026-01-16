import { createServerFn } from "@tanstack/react-start";
import { db, files, DEFAULT_EXPIRATION_DAYS } from "@sendy/db";
import { getUploadUrl, getDownloadUrl } from "@sendy/storage";
import { eq, or, and, isNotNull } from "drizzle-orm";

const SHORT_CODE_PATTERN = /^[A-Z0-9]{6}$/;

function isValidShortCode(code: string): boolean {
  return SHORT_CODE_PATTERN.test(code.toUpperCase());
}

function generateShortCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export const getPresignedUploadUrl = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      id: string;
      fileName: string;
      contentType: string;
      size: number;
      expirationDays?: number;
    }) => data
  )
  .handler(async ({ data }) => {
    const { id, fileName, contentType, size, expirationDays } = data;
    const s3Key = `files/${id}`;

    const uploadUrl = getUploadUrl({
      key: s3Key,
      contentType,
      expiresIn: 3600,
    });

    const expDays = expirationDays ?? DEFAULT_EXPIRATION_DAYS;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expDays);

    const shortCode = generateShortCode();

    await db.insert(files).values({
      id,
      shortCode,
      originalName: fileName,
      contentType,
      size,
      s3Key,
      expiresAt,
    });

    return { uploadUrl, shortCode };
  });

export const getFileMetadata = createServerFn({ method: "GET" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    if (!id || !id.trim()) {
      return { error: "Invalid file ID" };
    }

    const trimmedId = id.trim();
    const upperCaseId = trimmedId.toUpperCase();

    // Only include shortCode lookup if it matches the pattern (prevents matching empty/null)
    const file = await db.query.files.findFirst({
      where: isValidShortCode(trimmedId)
        ? or(
            eq(files.id, trimmedId),
            and(isNotNull(files.shortCode), eq(files.shortCode, upperCaseId))
          )
        : eq(files.id, trimmedId),
    });

    if (!file) {
      return { error: "File not found" };
    }

    if (new Date() > file.expiresAt) {
      return { error: "File has expired" };
    }

    return { file };
  });

export const getPresignedDownloadUrl = createServerFn({ method: "GET" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    if (!id || !id.trim()) {
      return { error: "Invalid file ID" };
    }

    const trimmedId = id.trim();
    const upperCaseId = trimmedId.toUpperCase();

    // Only include shortCode lookup if it matches the pattern (prevents matching empty/null)
    const file = await db.query.files.findFirst({
      where: isValidShortCode(trimmedId)
        ? or(
            eq(files.id, trimmedId),
            and(isNotNull(files.shortCode), eq(files.shortCode, upperCaseId))
          )
        : eq(files.id, trimmedId),
    });

    if (!file) {
      return { error: "File not found" };
    }

    if (new Date() > file.expiresAt) {
      return { error: "File has expired" };
    }

    const downloadUrl = getDownloadUrl({
      key: file.s3Key,
      expiresIn: 3600,
    });

    await db
      .update(files)
      .set({ downloadCount: file.downloadCount + 1 })
      .where(eq(files.id, id));

    return { downloadUrl };
  });
