import { Queue } from "bullmq";

const REDIS_URL = process.env.REDIS_URL;

function getConnection() {
  if (!REDIS_URL) {
    console.warn("[queue] REDIS_URL not set, scan jobs will not be enqueued");
    return null;
  }
  const url = new URL(REDIS_URL);
  return {
    host: url.hostname,
    port: Number(url.port) || 6379,
    password: url.password || undefined,
    tls: url.protocol === "rediss:" ? {} : undefined,
  };
}

const connection = getConnection();

export const scanQueue = connection
  ? new Queue<{ fileId: string; s3Key: string }>("file-scan", { connection })
  : null;
