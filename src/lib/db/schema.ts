import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  clientName: text("client_name"),
  clientProblems: text("client_problems"),
  competitorAnalysis: text("competitor_analysis"),
  projectRequirements: text("project_requirements"),
  clientNotes: text("client_notes"),
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
  referenceImages: text("reference_image", { mode: "json" }).$type<{ url: string; tag: "emulate" | "avoid" | null }[]>(),
  screenshotLabel: text("screenshot_label"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type Competitor = typeof competitors.$inferSelect;
export type NewCompetitor = typeof competitors.$inferInsert;

export const mockups = sqliteTable("mockups", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  prompt: text("prompt").notNull(),
  image: text("image").notNull(),
  label: text("label"),
  style: text("style"),
  originalPrompt: text("original_prompt"),
  customInstructions: text("custom_instructions"),
  styleRef: text("style_ref"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type Mockup = typeof mockups.$inferSelect;
export type NewMockup = typeof mockups.$inferInsert;

export const savedPrompts = sqliteTable("saved_prompts", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  prompt: text("prompt").notNull(),
  style: text("style"),
  pageType: text("page_type"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type SavedPrompt = typeof savedPrompts.$inferSelect;
export type NewSavedPrompt = typeof savedPrompts.$inferInsert;

export const designKits = sqliteTable("design_kits", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  tokens: text("tokens", { mode: "json" }).$type<Record<string, unknown>>(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type DesignKit = typeof designKits.$inferSelect;
export type NewDesignKit = typeof designKits.$inferInsert;

export const errorLogs = sqliteTable("error_logs", {
  id: text("id").primaryKey(),
  route: text("route").notNull(),
  method: text("method").notNull(),
  message: text("message").notNull(),
  stack: text("stack"),
  context: text("context", { mode: "json" }).$type<Record<string, unknown>>(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type ErrorLog = typeof errorLogs.$inferSelect;
export type NewErrorLog = typeof errorLogs.$inferInsert;

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  pageId: text("page_id")
    .notNull()
    .references(() => pages.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  price: text("price"),
  currency: text("currency").default("USD"),
  variants: text("variants", { mode: "json" }).$type<ProductVariant[]>(),
  specifications: text("specifications", { mode: "json" }).$type<Record<string, string>>(),
  images: text("images", { mode: "json" }).$type<string[]>(),
  category: text("category"),
  brand: text("brand"),
  sku: text("sku"),
  availability: text("availability"),
  rawExtraction: text("raw_extraction", { mode: "json" }).$type<Record<string, unknown>>(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export interface ProductVariant {
  name: string;
  options: string[];
}

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
