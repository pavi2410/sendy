import { bigint, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const files = pgTable("files", {
  id: text("id").primaryKey(),
  shortCode: text("short_code").unique(),
  originalName: text("original_name").notNull(),
  contentType: text("content_type").notNull(),
  size: integer("size").notNull(),
  s3Key: text("s3_key").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  downloadCount: integer("download_count").default(0).notNull(),
});

export type File = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;

export const scans = pgTable("scans", {
  id: bigint("id", { mode: "number" }).generatedAlwaysAsIdentity().primaryKey(),
  fileId: text("file_id")
    .notNull()
    .references(() => files.id, { onDelete: "cascade" }),
  verdict: text("verdict")
    .notNull()
    .$type<"pending" | "clean" | "suspicious" | "malicious" | "failed">(),
  reasons: text("reasons"),
  scannedAt: timestamp("scanned_at").defaultNow().notNull(),
  priority: integer("priority").default(0).notNull(),
});

export type Scan = typeof scans.$inferSelect;
export type NewScan = typeof scans.$inferInsert;
