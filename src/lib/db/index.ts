import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";

const sqlite = new Database("sqlite.db");
export const db = drizzle(sqlite, { schema });

// Initialize database tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    client_name TEXT,
    crawl_job_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS pages (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT,
    content TEXT,
    screenshot TEXT,
    full_page_screenshot TEXT,
    metadata TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS page_versions (
    id TEXT PRIMARY KEY,
    page_id TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    url TEXT NOT NULL,
    title TEXT,
    content TEXT,
    screenshot TEXT,
    full_page_screenshot TEXT,
    metadata TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS analyses (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    content TEXT,
    created_at INTEGER NOT NULL
  );
`);

// Migration: Add screenshot column to pages table if it doesn't exist
try {
  sqlite.exec(`ALTER TABLE pages ADD COLUMN screenshot TEXT`);
} catch {
  // Column already exists, ignore error
}

// Migration: Add crawl_job_id column to projects table if it doesn't exist
try {
  sqlite.exec(`ALTER TABLE projects ADD COLUMN crawl_job_id TEXT`);
} catch {
  // Column already exists, ignore error
}

// Migration: Add version column to pages table if it doesn't exist
try {
  sqlite.exec(`ALTER TABLE pages ADD COLUMN version INTEGER NOT NULL DEFAULT 1`);
} catch {
  // Column already exists, ignore error
}

// Migration: Create page_versions table if it doesn't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS page_versions (
    id TEXT PRIMARY KEY,
    page_id TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    url TEXT NOT NULL,
    title TEXT,
    content TEXT,
    screenshot TEXT,
    full_page_screenshot TEXT,
    metadata TEXT,
    created_at INTEGER NOT NULL
  )
`);

// Migration: Add full_page_screenshot column to pages table if it doesn't exist
try {
  sqlite.exec(`ALTER TABLE pages ADD COLUMN full_page_screenshot TEXT`);
} catch {
  // Column already exists, ignore error
}

// Migration: Add full_page_screenshot column to page_versions table if it doesn't exist
try {
  sqlite.exec(`ALTER TABLE page_versions ADD COLUMN full_page_screenshot TEXT`);
} catch {
  // Column already exists, ignore error
}

export { schema };
