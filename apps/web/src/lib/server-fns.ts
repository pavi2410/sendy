import { createServerFn } from "@tanstack/react-start";
import { db, files, DEFAULT_EXPIRATION_DAYS } from "@sendy/db";
import { getUploadUrl, getDownloadUrl } from "@sendy/storage";
import { eq } from "drizzle-orm";

export const getPresignedUploadUrl = createServerFn({ method: "POST" })
  .validator(
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

    const uploadUrl = await getUploadUrl({
      key: s3Key,
      contentType,
      contentLength: size,
      expiresIn: 3600,
    });

    const expDays = expirationDays ?? DEFAULT_EXPIRATION_DAYS;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expDays);

    await db.insert(files).values({
      id,
      originalName: fileName,
      contentType,
      size,
      s3Key,
      expiresAt,
    });

    return { uploadUrl };
  });

export const getFileMetadata = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const file = await db.query.files.findFirst({
      where: eq(files.id, id),
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
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const file = await db.query.files.findFirst({
      where: eq(files.id, id),
    });

    if (!file) {
      return { error: "File not found" };
    }

    if (new Date() > file.expiresAt) {
      return { error: "File has expired" };
    }

    const downloadUrl = await getDownloadUrl({
      key: file.s3Key,
      filename: file.originalName,
      expiresIn: 3600,
    });

    await db
      .update(files)
      .set({ downloadCount: file.downloadCount + 1 })
      .where(eq(files.id, id));

    return { downloadUrl };
  });
