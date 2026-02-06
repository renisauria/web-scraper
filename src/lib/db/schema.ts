import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  clientName: text("client_name"),
  clientProblems: text("client_problems"),
  clientGoals: text("client_goals"),
  crawlJobId: text("crawl_job_id"),
  status: text("status", {
    enum: ["pending", "scraping", "scraped", "analyzing", "complete", "error"],
  })
    .notNull()
    .default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const pages = sqliteTable("pages", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  title: text("title"),
  content: text("content"),
  screenshot: text("screenshot"),
  fullPageScreenshot: text("full_page_screenshot"),
  metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(),
  version: integer("version").notNull().default(1),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const pageVersions = sqliteTable("page_versions", {
  id: text("id").primaryKey(),
  pageId: text("page_id")
    .notNull()
    .references(() => pages.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  url: text("url").notNull(),
  title: text("title"),
  content: text("content"),
  screenshot: text("screenshot"),
  fullPageScreenshot: text("full_page_screenshot"),
  metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const analyses = sqliteTable("analyses", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  type: text("type", {
    enum: ["marketing", "techstack", "architecture", "performance", "recommendations"],
  }).notNull(),
  content: text("content", { mode: "json" }).$type<Record<string, unknown>>(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const sitemaps = sqliteTable("sitemaps", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["current", "recommended"] }).notNull(),
  data: text("data", { mode: "json" }).$type<Record<string, unknown>>(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;
export type PageVersion = typeof pageVersions.$inferSelect;
export type NewPageVersion = typeof pageVersions.$inferInsert;
export type Analysis = typeof analyses.$inferSelect;
export type NewAnalysis = typeof analyses.$inferInsert;
export type Sitemap = typeof sitemaps.$inferSelect;
export type NewSitemap = typeof sitemaps.$inferInsert;

export const competitors = sqliteTable("competitors", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  url: text("url").notNull(),
  type: text("type", { enum: ["competitor", "inspiration"] }).notNull().default("competitor"),
  preferredFeature: text("preferred_feature"),
  preferredFeatureUrl: text("preferred_feature_url"),
  screenshot: text("screenshot"),
  referenceImages: text("reference_image", { mode: "json" }).$type<string[]>(),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type Competitor = typeof competitors.$inferSelect;
export type NewCompetitor = typeof competitors.$inferInsert;
