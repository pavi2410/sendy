import { db, files } from "@sendy/db";
import { deleteFile } from "@sendy/storage";
import { lt, eq } from "drizzle-orm";

async function garbageCollect() {
  console.log("[GC] Starting garbage collection...");
  const now = new Date();

  const expiredFiles = await db
    .select()
    .from(files)
    .where(lt(files.expiresAt, now));

  console.log(`[GC] Found ${expiredFiles.length} expired files`);

  let deleted = 0;
  let failed = 0;

  for (const file of expiredFiles) {
    try {
      await deleteFile(file.s3Key);
      await db.delete(files).where(eq(files.id, file.id));
      deleted++;
      console.log(`[GC] Deleted: ${file.id} (${file.originalName})`);
    } catch (error) {
      failed++;
      console.error(`[GC] Failed to delete ${file.id}:`, error);
    }
  }

  console.log(`[GC] Garbage collection complete. Deleted: ${deleted}, Failed: ${failed}`);
}

garbageCollect()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[GC] Fatal error:", error);
    process.exit(1);
  });
