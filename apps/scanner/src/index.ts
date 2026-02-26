import { availableParallelism } from "node:os";
import { Worker, type Job } from "bullmq";
import { db, scans, files } from "@sendy/db";
import { s3 } from "@sendy/storage";
import { eq } from "drizzle-orm";
import { scanBytes } from "pompelmi";

const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) throw new Error("REDIS_URL environment variable is required");

const redisUrl = new URL(REDIS_URL);
const connection = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port) || 6379,
  password: redisUrl.password || undefined,
  tls: redisUrl.protocol === "rediss:" ? {} : undefined,
};

const worker = new Worker<{ fileId: string; s3Key: string }>(
  "file-scan",
  async (job) => {
    const { fileId, s3Key } = job.data;

    console.log(`[scanner] Processing file ${fileId} (${s3Key})`);

    const file = await db.query.files.findFirst({
      where: eq(files.id, fileId),
    });

    if (!file) {
      console.warn(`[scanner] File ${fileId} not found in DB, skipping`);
      return;
    }

    if (new Date() > file.expiresAt) {
      console.warn(`[scanner] File ${fileId} already expired, skipping`);
      return;
    }

    const arrayBuffer = await s3.file(s3Key).arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await scanBytes(buffer, {
      preset: 'balanced'
    });
    const verdict = result.verdict as "clean" | "suspicious" | "malicious";
    const reasons = result.reasons?.length
      ? JSON.stringify(result.reasons)
      : null;

    console.log(`[scanner] File ${fileId} verdict: ${verdict}`);

    await db.insert(scans).values({
      fileId,
      verdict,
      reasons,
      priority: job.opts.priority ?? 0,
    });

    if (verdict === "suspicious") {
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await db.update(files).set({ expiresAt }).where(eq(files.id, fileId));
      console.log(`[scanner] File ${fileId} marked suspicious, expires in 1hr`);
    } else if (verdict === "malicious") {
      await db.update(files).set({ expiresAt: new Date() }).where(eq(files.id, fileId));
      console.log(`[scanner] File ${fileId} marked malicious, flagged for GC`);
    }
  },
  {
    connection,
    concurrency: availableParallelism(),
    stalledInterval: 30_000,
    maxStalledCount: 3,
  }
);

worker.on("completed", (job: Job<{ fileId: string; s3Key: string }>) => {
  console.log(`[scanner] Job ${job.id} completed for file ${job.data.fileId}`);
});

worker.on("failed", async (job: Job<{ fileId: string; s3Key: string }> | undefined, err: Error) => {
  console.error(`[scanner] Job ${job?.id} failed:`, err.message);

  if (job && job.attemptsMade >= (job.opts.attempts ?? 3)) {
    console.error(`[scanner] Max retries reached for file ${job.data.fileId}, marking as failed`);
    await db.insert(scans).values({
      fileId: job.data.fileId,
      verdict: "failed",
      reasons: JSON.stringify([err.message]),
      priority: job.opts.priority ?? 0,
    });
  }
});

console.log(`[scanner] Worker started (concurrency: ${availableParallelism()})`);

