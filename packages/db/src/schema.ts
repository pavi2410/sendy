import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";

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
